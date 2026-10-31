FROM alpine:3.24.3@sha256:be2656061b536c1883c4034790e21d0a09c5aaaf51968b89368a3c0371ea2c9a
RUN adduser -D -H -u 10001 app
WORKDIR /work
USER app
HEALTHCHECK --interval=30s --timeout=3s CMD ["sh", "-c", "true"]
CMD ["sh", "-c", "echo ready"]
