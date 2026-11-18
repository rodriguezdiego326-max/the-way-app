FROM python:3.13-slim

RUN useradd --create-home --shell /usr/sbin/nologin solapath

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src ./src

USER solapath

CMD ["python", "src/agent.py", "start"]
