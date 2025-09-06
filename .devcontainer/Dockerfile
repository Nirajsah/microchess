FROM mcr.microsoft.com/devcontainers/base:ubuntu

# Install system packages
RUN apt-get update && apt-get install -y \
    curl \
    git \
    vim \
    build-essential \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

