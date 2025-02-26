package com.mars.app.config.security;

import com.mars.app.auth.entrypoint.UnauthorizedEntryPoint;
import com.mars.app.auth.filter.OAuth2LogoutFilter;
import com.mars.app.auth.handler.OAuth2SuccessHandler;
import com.mars.app.auth.service.OAuth2LogoutService;
import com.mars.app.auth.service.OAuth2UserService;
import com.mars.app.auth.filter.JwtAuthenticationFilter;
import com.mars.app.auth.vo.OAuth2RequestResolver;
import com.mars.common.util.web.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.logout.LogoutFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.Arrays;
import java.util.stream.Stream;

@RequiredArgsConstructor
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${client.host}")
    private String clientHost;

    private static final String[] WHITE_LIST = {
        "/api/user/notification/subscribe",
        "/api/common/version",
        "/api/oauth2/authorization/**",
        "/api/login/oauth2/code/**",
        "/api/auth/reissue",
        "/api/ingredient/search",
    };
    private static final String[] WHITE_LIST_SWAGGER = {
        "/swagger-ui/**",
        "/swagger-ui.html",
        "/api-docs/**",
        "/v3/api-docs/**",
    };
    private static final String[] WHITE_LIST_RECIPE = {
        "/api/recipe/recommendations",
        "/api/recipe/search/",
        "/api/recipe/{id}",
        "/api/image/optimize",
        "/api/recipe/{id}/comment",
        "/api/recipe/{id}/comment/count",
        "/api/recipe/{id}/like/count",
        "/api/recipe/{id}/like/notification/subscribe",
    };
    private static final String[] WHITE_LIST_COMMUNITY = {
        "/api/community/{id}",
        "/api/community/{id}/comment",
        "/api/community/{id}/comment/count",
        "/api/community/{id}/like/count",
        "/api/community/{id}/like/notification/subscribe",
    };
    private static final String[] WHITE_LIST_USER_RECIPE = {
        "/api/user-recipe/{id}",
        "/api/user-recipe/{id}/comment",
        "/api/user-recipe/{id}/comment/count",
        "/api/user-recipe/{id}/like/count",
        "/api/user-recipe/{id}/like/notification/subscribe",
    };


    private final JwtUtil jwtUtil;
    private final OAuth2UserService oauth2UserService;
    private final OAuth2SuccessHandler oauth2SuccessHandler;
    private final OAuth2LogoutService oauth2LogoutService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
        ClientRegistrationRepository clientRegistrationRepository) throws Exception {

        OAuth2AuthorizationRequestResolver customResolver =
            new OAuth2RequestResolver(clientRegistrationRepository, "/api/oauth2/authorization");

        return http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .formLogin(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .addFilterBefore(new JwtAuthenticationFilter(jwtUtil), UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(new OAuth2LogoutFilter(oauth2LogoutService), LogoutFilter.class)
            .exceptionHandling(exception -> exception
                .authenticationEntryPoint(new UnauthorizedEntryPoint())
            )
            .oauth2Login(oauth2 -> oauth2
                .authorizationEndpoint(authorization ->
                    authorization
                        .authorizationRequestResolver(customResolver)
                )
                .loginProcessingUrl("/api/login/oauth2/code/*")
                .userInfoEndpoint(userInfoEndpointConfig ->
                    userInfoEndpointConfig.userService(oauth2UserService))
                .successHandler(oauth2SuccessHandler)
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    Stream.of(WHITE_LIST,
                            WHITE_LIST_SWAGGER,
                            WHITE_LIST_RECIPE,
                            WHITE_LIST_COMMUNITY,
                            WHITE_LIST_USER_RECIPE
                        )
                        .flatMap(Arrays::stream)
                        .toArray(String[]::new)
                ).permitAll()
                .requestMatchers(
                    "/api/recipe/{id}/comment/**",
                    "/api/recipe/{id}/like/**",
                    "/api/recipe/{id}/favorite/**",
                    "/api/community/{id}/comment/**",
                    "/api/community/{id}/like/**"
                )
                .hasAuthority("ROLE_USER")
                .anyRequest().authenticated()
            )
            .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.addAllowedOrigin(clientHost);
        configuration.addAllowedMethod("*");
        configuration.addAllowedHeader("*");
        configuration.setAllowCredentials(true);
        configuration.addExposedHeader("Set-Cookie");

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
