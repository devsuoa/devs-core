package com.devsuoa.api.auth;

import java.util.Collection;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

/** A verified Supabase JWT plus the profile it belongs to. */
public class DevsAuthentication extends AbstractAuthenticationToken {

    private final Jwt jwt;
    private final CurrentUser user;

    public DevsAuthentication(Jwt jwt, CurrentUser user, Collection<? extends GrantedAuthority> authorities) {
        super(authorities);
        this.jwt = jwt;
        this.user = user;
        setAuthenticated(true);
    }

    @Override
    public Object getCredentials() {
        return jwt;
    }

    @Override
    public CurrentUser getPrincipal() {
        return user;
    }

    @Override
    public String getName() {
        return user.id().toString();
    }
}
