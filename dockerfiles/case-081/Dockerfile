FROM debian:buster-20190708-slim@sha256:0cee610aaf530adfbddf9ce6e679d57c67882f37b6aeaac1ce027e1e13dad4d5
RUN useradd --system --uid 10001 --no-create-home app
WORKDIR /work
USER app
HEALTHCHECK --interval=30s --timeout=3s CMD ["sh", "-c", "true"]
CMD ["sh", "-c", "echo ready"]
