package com.dental.clinic.management.utils;

import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpResponse;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

import com.dental.clinic.management.utils.annotation.ApiMessage;

import jakarta.servlet.http.HttpServletResponse;

@ControllerAdvice
public class FormatRestResponse implements ResponseBodyAdvice<Object> {

    @Override
    public boolean supports(MethodParameter returnType, Class<? extends HttpMessageConverter<?>> converterType) {
        return returnType.getDeclaringClass().getPackageName()
                .startsWith("com.dental.clinic.management.controller");
    }

    @Override
    public Object beforeBodyWrite(
            @SuppressWarnings("null") Object body,
            MethodParameter returnType,
            MediaType selectedContentType,
            Class<? extends HttpMessageConverter<?>> selectedConverterType,
            ServerHttpRequest request,
            ServerHttpResponse response) {

        HttpServletResponse servletResponse = ((ServletServerHttpResponse) response).getServletResponse();
        int status = servletResponse.getStatus();

        // Không format nếu là String hoặc error response
        if (body instanceof String || status >= 400) {
            return body;
        }

        // Không format nếu đã là RestResponse để tránh nested wrapper
        if (body instanceof RestResponse) {
            return body;
        }

        // Tạo response wrapper
        RestResponse<Object> res = new RestResponse<>();
        ApiMessage message = returnType.getMethodAnnotation(ApiMessage.class);
        res.setStatusCode(status);
        res.setData(body);
        res.setMessage(message != null ? message.value() : "CALL API SUCCESS");

        return res;
    }

    // Inner class RestResponse
    public static class RestResponse<T> {
        private int statusCode;
        private String error;
        private Object message;
        private T data;

        // Constructors
        public RestResponse() {
        }

        public RestResponse(int statusCode, Object message, T data) {
            this.statusCode = statusCode;
            this.message = message;
            this.data = data;
        }

        // Getters and Setters
        public int getStatusCode() {
            return statusCode;
        }

        public void setStatusCode(int statusCode) {
            this.statusCode = statusCode;
        }

        public String getError() {
            return error;
        }

        public void setError(String error) {
            this.error = error;
        }

        public Object getMessage() {
            return message;
        }

        public void setMessage(Object message) {
            this.message = message;
        }

        public T getData() {
            return data;
        }

        public void setData(T data) {
            this.data = data;
        }
    }
}
