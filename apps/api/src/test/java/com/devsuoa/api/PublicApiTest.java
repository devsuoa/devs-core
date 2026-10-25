package com.devsuoa.api;

import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

class PublicApiTest extends IntegrationTest {

    @Autowired MockMvc mvc;

    @Test
    void eventsListOnlyActiveEventsAndNoInternalFields() throws Exception {
        mvc.perform(get("/api/events"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", hasItem(FREE_EVENT.toString())))
                .andExpect(jsonPath("$[*].id", not(hasItem(HIDDEN_EVENT.toString()))))
                .andExpect(jsonPath("$[*].is_active", everyItem(org.hamcrest.Matchers.is(true))))
                .andExpect(jsonPath("$[0].google_sheet_url").doesNotExist())
                .andExpect(jsonPath("$[0].bank_account_number").doesNotExist());
    }

    @Test
    void linksHideInactiveOnes() throws Exception {
        mvc.perform(get("/api/links"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].title", hasItem("Join DEVS")))
                .andExpect(jsonPath("$[*].title", not(hasItem("Old form"))));
    }

    @Test
    void degreesAndMajors() throws Exception {
        mvc.perform(get("/api/degrees")).andExpect(status().isOk()).andExpect(jsonPath("$[*].name", hasItem("Bachelor of Science")));
        mvc.perform(get("/api/degrees/10000000-0000-4000-8000-000000000001/majors"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].name", hasItem("Computer Science")))
                .andExpect(jsonPath("$[*].name", not(hasItem("Software Engineering"))));
    }

    @Test
    void contactFormValidatesAndEscapes() throws Exception {
        mvc.perform(post("/api/contact").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"kind":"contact","name":"<script>x</script>","email":"a@example.test","message":"hi"}
                                """))
                .andExpect(status().isAccepted());
        mvc.perform(post("/api/contact").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"kind":"contact","name":"A","email":"not-an-email","message":"hi","to":"victim@example.test"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("invalid_input"));
    }

    @Test
    void errorsDoNotLeakInternals() throws Exception {
        mvc.perform(get("/api/degrees/not-a-uuid/majors"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.trace").doesNotExist())
                .andExpect(jsonPath("$.code").value("invalid_input"));
    }
}
