package com.devsuoa.api.members;

import com.devsuoa.api.auth.ActorContext;
import com.devsuoa.api.common.ApiException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MembersController {

    public record DegreeChoice(@NotNull UUID degreeId, @NotNull @Size(max = 4) List<@NotNull UUID> majorIds) {}

    public record Signup(
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(max = 100) String firstName,
            @NotBlank @Size(max = 100) String lastName,
            @NotNull @Pattern(regexp = "male|female|non-binary|prefer-not-to-say") String gender,
            @NotNull @Pattern(regexp = "UOA|AUT|Other") String university,
            @NotNull @Min(1) @Max(10) Integer universityYear,
            @Size(max = 20) @Pattern(regexp = "^[A-Za-z0-9]*$") String upi,
            @NotNull @Positive @Max(9_999_999_999L) Long studentId,
            @NotEmpty @Size(max = 3) List<@Valid @NotNull DegreeChoice> degrees) {}

    public record Member(
            Long studentId,
            String firstName,
            String lastName,
            String email,
            String university,
            Integer universityYear,
            String gender,
            OffsetDateTime createdAt,
            List<String> degrees,
            List<String> majors) {}

    private final JdbcClient jdbc;
    private final ActorContext actor;

    public MembersController(JdbcClient jdbc, ActorContext actor) {
        this.jdbc = jdbc;
        this.actor = actor;
    }

    /**
     * Joins the society. One transaction for the member and their degrees, so a failure leaves
     * nothing half-written. An existing member gets 409 and their record is left untouched.
     */
    @PostMapping("/api/members")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    void join(@Valid @RequestBody Signup s) {
        actor.bind();
        String email = s.email().trim().toLowerCase(Locale.ROOT);

        boolean exists = jdbc.sql("select exists(select 1 from public.members where email = :email or student_id = :sid)")
                .param("email", email).param("sid", s.studentId())
                .query(Boolean.class).single();
        if (exists) throw ApiException.conflict("already_member", "You're already signed up!");

        jdbc.sql("""
                insert into public.members (email, first_name, last_name, gender, university, university_year, upi, student_id)
                values (:email, :first, :last, cast(:gender as public.gender_enum), cast(:uni as public.university_enum),
                        :year, :upi, :sid)
                """)
                .param("email", email)
                .param("first", s.firstName().trim())
                .param("last", s.lastName().trim())
                .param("gender", s.gender())
                .param("uni", s.university())
                .param("year", s.universityYear())
                .param("upi", s.upi() == null || s.upi().isBlank() ? null : s.upi().trim().toLowerCase(Locale.ROOT))
                .param("sid", s.studentId())
                .update();

        Set<UUID> degreeIds = new LinkedHashSet<>();
        for (DegreeChoice d : s.degrees()) {
            if (degreeIds.add(d.degreeId())) {
                jdbc.sql("insert into public.student_degree (student_id, degree_id) values (:sid, :degree)")
                        .param("sid", s.studentId()).param("degree", d.degreeId())
                        .update();
            }
            for (UUID major : new LinkedHashSet<>(d.majorIds())) {
                // The (degree, major) foreign key rejects majors the degree doesn't offer.
                jdbc.sql("""
                        insert into public.student_major (student_id, degree_id, major_id) values (:sid, :degree, :major)
                        on conflict do nothing
                        """)
                        .param("sid", s.studentId()).param("degree", d.degreeId()).param("major", major)
                        .update();
            }
        }
    }

    @GetMapping("/api/admin/members")
    List<Member> registry() {
        return jdbc.sql("""
                select student_id, first_name, last_name, email, university::text as university, university_year,
                       gender::text as gender, created_at, degrees, majors
                from public.member_registry order by created_at desc
                """)
                .query((rs, n) -> new Member(
                        (Long) rs.getObject("student_id"),
                        rs.getString("first_name"),
                        rs.getString("last_name"),
                        rs.getString("email"),
                        rs.getString("university"),
                        (Integer) rs.getObject("university_year", Integer.class),
                        rs.getString("gender"),
                        rs.getObject("created_at", OffsetDateTime.class),
                        array(rs.getArray("degrees")),
                        array(rs.getArray("majors"))))
                .list();
    }

    private static List<String> array(java.sql.Array a) throws java.sql.SQLException {
        if (a == null) return List.of();
        return Arrays.stream((Object[]) a.getArray()).map(String::valueOf).toList();
    }
}
