package com.devsuoa.api;

import static org.assertj.core.api.Assertions.assertThat;
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
