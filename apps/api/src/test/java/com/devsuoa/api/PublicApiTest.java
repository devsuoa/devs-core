package com.devsuoa.api;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

class PublicApiTest extends IntegrationTest {

    @Autowired MockMvc mvc;

    @Test
    void linksHideInactiveOnes() throws Exception {
        mvc.perform(get("/api/links"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].title", hasItem("Join DEVS")))
                .andExpect(jsonPath("$[*].title", not(hasItem("Old form"))));
    }

    @Test
    void errorsDoNotLeakInternals() throws Exception {
        mvc.perform(delete("/api/admin/links/not-a-uuid").header("Authorization", bearer(ADMIN)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.trace").doesNotExist())
                .andExpect(jsonPath("$.code").value("invalid_input"));
    }
}
