package com.devsuoa.api.auth;

import com.devsuoa.api.common.ApiException;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/** Static access to the caller, for services that are not handed it by a controller. */
public final class Auth {

    private Auth() {}

    public static Optional<CurrentUser> current() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        if (a instanceof DevsAuthentication d) return Optional.of(d.getPrincipal());
        return Optional.empty();
    }

    public static CurrentUser require() {
        return current().orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "unauthenticated", "Please log in."));
    }
}
