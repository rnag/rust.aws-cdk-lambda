ARG IMAGE=public.ecr.aws/sam/build-provided.al2
FROM $IMAGE

# installs Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs > rust-installer.sh \
	&& sh rust-installer.sh -y \
	&& rm rust-installer.sh
ENV PATH="/root/.cargo/bin:$PATH"

# pre-installs Rust targets
# reference: https://github.com/cargo-lambda/cargo-lambda/blob/6dac881a5a899bcbcd655ff43bc517bc04f60930/Dockerfile#L4-L6
RUN set -eux; \
	rustup toolchain install stable; \
	rustup target install x86_64-unknown-linux-gnu aarch64-unknown-linux-gnu;

# installs cargo-lambda for Python
RUN python3 -m ensurepip
RUN pip3 install cargo-lambda

# resets the entrypoint
ENTRYPOINT []
