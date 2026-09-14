package com.example.carrier.http;

import com.example.carrier.CarrierException;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.function.Supplier;

/**
 * Transport plumbing shared by the API carrier adapters: timeouts, and turning every
 * HTTP or I/O failure into a {@link CarrierException} whose message is safe to show an
 * operator.
 *
 * Messages carry the carrier's own error text and the HTTP status. They never carry the
 * request — no URL, header or body — so a credential cannot leak through an error.
 */
public final class CarrierHttp {

    public static final Duration TIMEOUT = Duration.ofSeconds(10);

    private CarrierHttp() {
    }

    /**
     * Applies connect and read timeouts to a builder. The JDK client is used rather than
     * {@code HttpURLConnection}, which refuses to expose a 401 response to a streamed POST
     * — and the Shiprocket adapter must see that 401 to re-authenticate.
     */
    public static RestClient.Builder withTimeouts(RestClient.Builder builder) {
        HttpClient client = HttpClient.newBuilder()
            .connectTimeout(TIMEOUT)
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(client);
        factory.setReadTimeout(TIMEOUT);
        return builder.requestFactory(factory);
    }

    /**
     * Runs one carrier call, translating Spring's client exceptions.
     *
     * @param carrier the label used to open the message, e.g. "Delhivery"
     */
    public static <T> T call(String carrier, Supplier<T> action) {
        try {
            return action.get();
        } catch (RestClientResponseException e) {
            throw new CarrierException(carrier + " returned HTTP " + e.getStatusCode().value() + ": "
                + CarrierJson.errorText(e.getResponseBodyAsString()), e);
        } catch (ResourceAccessException e) {
            throw new CarrierException(carrier + " could not be reached: " + rootCause(e), e);
        } catch (RestClientException e) {
            throw new CarrierException(carrier + " sent a response that could not be read", e);
        }
    }

    public static void run(String carrier, Runnable action) {
        call(carrier, () -> {
            action.run();
            return null;
        });
    }

    /**
     * The innermost cause's message — "Connection refused", "request timed out". Spring's
     * own wrapper message is skipped because it repeats the request URL.
     */
    private static String rootCause(Throwable e) {
        Throwable cause = e;
        while (cause.getCause() != null && cause.getCause() != cause) {
            cause = cause.getCause();
        }
        if (cause == e) {
            return "network error";
        }
        String message = cause.getMessage();
        return message == null || message.isBlank()
            ? cause.getClass().getSimpleName()
            : CarrierJson.truncate(message);
    }
}
