package com.devsuoa.api.auth;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

/**
 * Turns a verified JWT into a {@link DevsAuthentication}. The JWT only proves who the
 * caller is. What they may do is looked up in the database on every request, so removing
 * someone's admin role takes effect immediately rather than when their token expires.
 */
@Component
public class ProfileAuthenticationConverter implements Converter<Jwt, DevsAuthentication> {

    private final ProfileRepository profiles;

    public ProfileAuthenticationConverter(ProfileRepository profiles) {
        this.profiles = profiles;
    }

    @Override
    public DevsAuthentication convert(Jwt jwt) {
        UUID id = UUID.fromString(jwt.getSubject());
        String email = jwt.getClaimAsString("email");
        CurrentUser user = profiles.find(id)
                .map(p -> new CurrentUser(id, email, p.username(), p.role(), p.team(), p.superuser()))
                .orElseGet(() -> new CurrentUser(id, email, null, "user", null, false));

        List<GrantedAuthority> authorities = new ArrayList<>();
        if (user.isAdmin()) authorities.add(new SimpleGrantedAuthority(CurrentUser.ROLE_ADMIN));
        if (user.isSuperuserAdmin()) authorities.add(new SimpleGrantedAuthority(CurrentUser.ROLE_SUPERUSER));
        return new DevsAuthentication(jwt, user, authorities);
    }
}
