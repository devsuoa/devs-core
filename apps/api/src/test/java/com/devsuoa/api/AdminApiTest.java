package com.devsuoa.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

class AdminApiTest extends IntegrationTest {

    @Autowired MockMvc mvc;

    @Test
    void meReportsTheDatabaseRole() throws Exception {
        mvc.perform(get("/api/me").header("Authorization", bearer(SUPERUSER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("admin"))
                .andExpect(jsonPath("$.is_superuser").value(true))
                .andExpect(jsonPath("$.team").value("president"));
        mvc.perform(get("/api/me").header("Authorization", bearer(PLAIN_USER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("user"));
    }

    @Test
    void eventCrudValidatesInput() throws Exception {
        String bad = """
                {"title":"X","event_date":"2026-12-01","is_active":true,"group_rsvp_enabled":false,"payment_enabled":false,
                 "bank_transfer_enabled":false,"image_url":"javascript:alert(1)","rsvp_questions":[]}
                """;
        mvc.perform(post("/api/admin/events").header("Authorization", bearer(ADMIN)).contentType(MediaType.APPLICATION_JSON).content(bad))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("invalid_url"));

        String good = """
                {"title":"End of Year","event_date":"2026-12-01","is_active":false,"group_rsvp_enabled":false,"payment_enabled":true,
                 "charge_amount":5,"bank_transfer_enabled":true,"rsvp_questions":[]}
                """;
        String body = mvc.perform(post("/api/admin/events").header("Authorization", bearer(ADMIN))
                        .contentType(MediaType.APPLICATION_JSON).content(good))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.charge_amount").value(5))
                .andReturn().getResponse().getContentAsString();
        String id = body.replaceAll("^\\{\"id\":\"([^\"]+)\".*", "$1");

        mvc.perform(delete("/api/admin/events/" + id).header("Authorization", bearer(ADMIN))).andExpect(status().isNoContent());
        mvc.perform(delete("/api/admin/events/" + id).header("Authorization", bearer(ADMIN))).andExpect(status().isNotFound());
    }

    @Test
    void todosAreSeededOnceAndCommentsUseTheProfileName() throws Exception {
        mvc.perform(get("/api/admin/events/" + FREE_EVENT + "/todos").header("Authorization", bearer(ADMIN)))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(4)));
        String items = mvc.perform(get("/api/admin/events/" + FREE_EVENT + "/todos").header("Authorization", bearer(ADMIN)))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(4)))
                .andReturn().getResponse().getContentAsString();
        String itemId = items.replaceAll("^\\[\\{\"id\":\"([^\"]+)\".*", "$1");

        mvc.perform(post("/api/admin/todos/" + itemId + "/comments").header("Authorization", bearer(ADMIN))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"message\":\"Booked\",\"author_name\":\"Someone Else\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.author_name").value("Ada Admin"));
    }

    @Test
    void tasksAreFilteredByTeam() throws Exception {
        String task = """
                {"id":"%s","name":"Plan","label":"x","status":"todo","team":"%s","order":0}
                """;
        mvc.perform(post("/api/admin/tasks").header("Authorization", bearer(ADMIN)).contentType(MediaType.APPLICATION_JSON)
                .content(task.formatted("t-tech", "tech"))).andExpect(status().isCreated());
        mvc.perform(post("/api/admin/tasks").header("Authorization", bearer(ADMIN)).contentType(MediaType.APPLICATION_JSON)
                .content(task.formatted("t-social", "social"))).andExpect(status().isCreated());

        // Ada is on tech: sees tech, not social. Sam is president: sees both.
        mvc.perform(get("/api/admin/tasks").header("Authorization", bearer(ADMIN)))
                .andExpect(jsonPath("$[*].id", hasItem("t-tech")))
                .andExpect(jsonPath("$[?(@.id == 't-social')]").isEmpty());
        mvc.perform(get("/api/admin/tasks").header("Authorization", bearer(SUPERUSER)))
                .andExpect(jsonPath("$[*].id", hasItem("t-social")));
    }

    @Test
    void auditRestoreRevertsAndRefusesStaleRestores() throws Exception {
        String link = mvc.perform(post("/api/admin/links").header("Authorization", bearer(ADMIN)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Before\",\"url\":\"https://example.test\",\"is_active\":true}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        String id = link.replaceAll("^\\{\"id\":\"([^\"]+)\".*", "$1");

        mvc.perform(put("/api/admin/links/" + id).header("Authorization", bearer(ADMIN)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"After\",\"url\":\"https://example.test\",\"is_active\":true}"))
                .andExpect(status().isOk());
        String entry = sql("select id::text from public.admin_audit_log where target_table = 'links' and target_id = '" + id
                + "' and action = 'UPDATE' order by created_at desc limit 1", String.class);

        mvc.perform(post("/api/admin/audit-log/" + entry + "/restore").header("Authorization", bearer(SUPERUSER)))
                .andExpect(status().isNoContent());
        assertThat(sql("select title from public.links where id = '" + id + "'", String.class)).isEqualTo("Before");
        assertThat(sql("select undo_of from public.admin_audit_log where undo_of = '" + entry + "' limit 1", String.class)).isEqualTo(entry);

        // The row no longer matches what that entry left behind.
        mvc.perform(post("/api/admin/audit-log/" + entry + "/restore").header("Authorization", bearer(SUPERUSER)))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("changed_since"));
    }

    @Test
    void profileChangesCannotBeRestored() throws Exception {
        sql("insert into public.admin_audit_log (target_id, target_table, action, auth_id, target_old, target_new) values ('"
                + PLAIN_USER + "', 'profiles', 'UPDATE', '" + SUPERUSER + "', '{\"role\":\"admin\"}', '{\"role\":\"user\"}') returning 1", Integer.class);
        String entry = sql("select id::text from public.admin_audit_log where target_table = 'profiles' limit 1", String.class);
        mvc.perform(post("/api/admin/audit-log/" + entry + "/restore").header("Authorization", bearer(SUPERUSER)))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("not_restorable"));
    }
}
