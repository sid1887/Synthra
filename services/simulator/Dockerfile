# Simulator Service - ngspice & Verilator

FROM python:3.11-slim

WORKDIR /app

# Install simulation tools
RUN apt-get update && apt-get install -y \
    ngspice \
    verilator \
    iverilog \
    gtkwave \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /simulations

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
