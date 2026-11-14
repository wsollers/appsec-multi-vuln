FROM alpine:3.24.4@sha256:f59abe656b692d901e184be3445e084786602108599d2a51d229c0f5a48c71bf
RUN adduser -D -H -u 10001 app
WORKDIR /work
USER app
HEALTHCHECK --interval=30s --timeout=3s CMD ["sh", "-c", "true"]
CMD ["sh", "-c", "echo ready"]
