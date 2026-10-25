package com.devsuoa.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

class RsvpFlowTest extends IntegrationTest {

    static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0};

    @Autowired MockMvc mvc;

    ResultActions join(String email, long studentId) throws Exception {
        return mvc.perform(post("/api/members").contentType(MediaType.APPLICATION_JSON).content("""
                {"email":"%s","first_name":"Test","last_name":"Person","gender":"prefer-not-to-say","university":"UOA",
                 "university_year":1,"upi":"tper%d","student_id":%d,
                 "degrees":[{"degree_id":"10000000-0000-4000-8000-000000000001","major_ids":["20000000-0000-4000-8000-000000000001"]}]}
                """.formatted(email, studentId % 1000, studentId)));
    }

    ResultActions rsvp(UUID event, String email, String extra) throws Exception {
        return mvc.perform(post("/api/events/" + event + "/rsvps").contentType(MediaType.APPLICATION_JSON).content("""
                {"leader_email":"%s","group_emails":[%s],"dietary_requirements":null,"answers":{"level":"New"}}
                """.formatted(email, extra)));
    }

    @Test
    void memberCanJoinOnceAndDegreesAreSaved() throws Exception {
        join("new.member@example.test", 910000001).andExpect(status().isCreated());
        join("NEW.MEMBER@example.test", 910000099).andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("already_member"));
        assertThat(sql("select count(*) from public.student_major where student_id = 910000001", Long.class)).isEqualTo(1L);
    }

    @Test
    void joinRejectsAMajorTheDegreeDoesNotOffer() throws Exception {
        mvc.perform(post("/api/members").contentType(MediaType.APPLICATION_JSON).content("""
                        {"email":"bad.combo@example.test","first_name":"A","last_name":"B","gender":"male","university":"UOA",
                         "university_year":1,"student_id":910000002,
                         "degrees":[{"degree_id":"10000000-0000-4000-8000-000000000001","major_ids":["20000000-0000-4000-8000-000000000002"]}]}
                        """))
                .andExpect(status().isConflict());
        // Nothing half-written: the member row was rolled back with the failed major.
        assertThat(sql("select count(*) from public.members where student_id = 910000002", Long.class)).isZero();
    }

    @Test
    void freeRsvpRules() throws Exception {
        join("rsvp.rules@example.test", 910000003).andExpect(status().isCreated());

        rsvp(FREE_EVENT, "not.a.member@example.test", "").andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("not_member"));
        mvc.perform(post("/api/events/" + FREE_EVENT + "/rsvps").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"leader_email\":\"rsvp.rules@example.test\",\"group_emails\":[],\"answers\":{}}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("answer_required"));
        mvc.perform(post("/api/events/" + FREE_EVENT + "/rsvps").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"leader_email\":\"rsvp.rules@example.test\",\"group_emails\":[],\"answers\":{\"level\":\"Expert\"}}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("invalid_answer"));

        rsvp(FREE_EVENT, "rsvp.rules@example.test", "\"friend@example.test\"").andExpect(status().isCreated());
        rsvp(FREE_EVENT, "rsvp.rules@example.test", "").andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("already_rsvped"));

        rsvp(HIDDEN_EVENT, "rsvp.rules@example.test", "").andExpect(status().isNotFound());
        rsvp(PAID_EVENT, "rsvp.rules@example.test", "").andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("payment_required"));
        rsvp(TINY_EVENT, "rsvp.rules@example.test", "\"plus.one@example.test\"")
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("group_rsvp_disabled"));
    }

    @Test
    void clientCannotSetPaymentOrAttendanceFields() throws Exception {
        join("sneaky@example.test", 910000004).andExpect(status().isCreated());
        mvc.perform(post("/api/events/" + TINY_EVENT + "/rsvps").contentType(MediaType.APPLICATION_JSON).content("""
                        {"leader_email":"sneaky@example.test","group_emails":[],"answers":{},
                         "present":true,"payment_method":"stripe","bank_payment_proof_path":"events/payments/x/y.png"}
                        """))
                .andExpect(status().isCreated());
        assertThat(sql("select present::text || coalesce(payment_method, '-') || coalesce(bank_payment_proof_path, '-') "
                + "from public.events_rsvp where email = 'sneaky@example.test'", String.class)).isEqualTo("false--");
        // Tiny Meetup has one seat, now taken.
        join("too.late@example.test", 910000005).andExpect(status().isCreated());
        rsvp(TINY_EVENT, "too.late@example.test", "").andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("event_full"));
    }

    @Test
    void bankTransferProofIsPrivateToAdmins() throws Exception {
        join("payer@example.test", 910000006).andExpect(status().isCreated());
        MockMultipartFile rsvpPart = new MockMultipartFile("rsvp", "", "application/json",
                "{\"leader_email\":\"payer@example.test\",\"group_emails\":[],\"answers\":{}}".getBytes());

        mvc.perform(multipart("/api/events/" + PAID_EVENT + "/rsvps/bank-transfer")
                        .file(rsvpPart).file(new MockMultipartFile("proof", "proof.png", "image/png", "<svg onload=alert(1)>".getBytes())))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("unsupported_image"));

        String body = mvc.perform(multipart("/api/events/" + PAID_EVENT + "/rsvps/bank-transfer")
                        .file(rsvpPart).file(new MockMultipartFile("proof", "proof.png", "image/png", PNG)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String id = body.replaceAll(".*\"id\":\"([^\"]+)\".*", "$1");

        String path = sql("select bank_payment_proof_path from public.events_rsvp where id = '" + id + "'", String.class);
        assertThat(path).startsWith("proofs/" + PAID_EVENT + "/").doesNotContain("payer");

        mvc.perform(get("/api/admin/rsvps/" + id + "/payment-proof")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/admin/rsvps/" + id + "/payment-proof").header("Authorization", bearer(PLAIN_USER))).andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/rsvps/" + id + "/payment-proof").header("Authorization", bearer(ADMIN)))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "image/png"))
                .andExpect(header().string("Cache-Control", "no-store"));
        mvc.perform(get("/api/files/public/event-payments/" + path)).andExpect(status().isNotFound());
    }

    @Test
    void adminsSeeAttendeesAndMarkPresence() throws Exception {
        join("attendee@example.test", 910000007).andExpect(status().isCreated());
        rsvp(FREE_EVENT, "attendee@example.test", "").andExpect(status().isCreated());
        String id = sql("select id::text from public.events_rsvp where email = 'attendee@example.test'", String.class);

        mvc.perform(get("/api/admin/rsvps").param("event_id", FREE_EVENT.toString()).header("Authorization", bearer(ADMIN)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.members[?(@.email == 'attendee@example.test')].student_id").value(910000007));
        mvc.perform(patch("/api/admin/rsvps/" + id + "/present").header("Authorization", bearer(ADMIN))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"present\":true}"))
                .andExpect(status().isNoContent());
        assertThat(sql("select present from public.events_rsvp where id = '" + id + "'", Boolean.class)).isTrue();

        // The audit trigger still records who did it, now that the API makes the change.
        assertThat(sql("select admin_name from public.admin_audit_log where target_table = 'events_rsvp' and target_id = '" + id
                + "' and action = 'UPDATE' order by created_at desc limit 1", String.class)).isEqualTo("Ada Admin");
    }
}
