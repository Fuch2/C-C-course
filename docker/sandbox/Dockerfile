FROM debian:trixie-slim
RUN apt-get update && apt-get install -y --no-install-recommends gcc g++ clang libclang-rt-dev llvm valgrind libc6-dev python3 libsqlite3-dev nlohmann-json3-dev ca-certificates && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid 10001 student && useradd --uid 10001 --gid 10001 --no-create-home --shell /usr/sbin/nologin student \
    && mkdir /work && chown 10001:10001 /work
USER 10001:10001
WORKDIR /work
ENTRYPOINT ["/usr/bin/sleep", "90"]
