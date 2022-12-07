FROM denoland/deno:alpine-1.28.3

WORKDIR /app

USER deno

COPY deps.ts .
RUN deno cache deps.ts

ADD . .

RUN deno cache mod.ts

CMD ["run", "--allow-read", "--allow-env", "--allow-write", "--allow-net", "mod.ts"]