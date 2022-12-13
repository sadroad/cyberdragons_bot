FROM denoland/deno:alpine-1.28.3

WORKDIR /app

COPY deps.ts .
RUN deno cache deps.ts

ADD . .

RUN deno cache mod.ts

CMD ["deno", "run", "--allow-read", "--allow-env", "--allow-write", "--allow-net", "mod.ts"]