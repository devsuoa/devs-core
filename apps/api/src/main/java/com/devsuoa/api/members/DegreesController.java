package com.devsuoa.api.members;

import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

/** Reference data for the join form: degrees and the majors each offers. */
@RestController
public class DegreesController {

    public record Option(UUID id, String name) {}

    private final JdbcClient jdbc;

    public DegreesController(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping("/api/degrees")
    List<Option> degrees() {
        return jdbc.sql("select id, name from public.degrees order by name")
                .query((rs, n) -> new Option(rs.getObject("id", UUID.class), rs.getString("name")))
                .list();
    }

    @GetMapping("/api/degrees/{degreeId}/majors")
    List<Option> majors(@PathVariable UUID degreeId) {
        return jdbc.sql("""
                select m.id, m.name from public.degree_major dm
                join public.majors m on m.id = dm.major_id
                where dm.degree_id = :degreeId
                order by m.name
                """)
                .param("degreeId", degreeId)
                .query((rs, n) -> new Option(rs.getObject("id", UUID.class), rs.getString("name")))
                .list();
    }
}
