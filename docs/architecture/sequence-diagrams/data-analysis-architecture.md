```mermaid

architecture-beta
    group frontend(cloud)[Analytics Frontend]
    group processing(cloud)[Data Processing]
    group storage(cloud)[Data Storage]
    group insights(cloud)[Community Insights]

    service dashboard(server)[Community Dashboard] in frontend
    service reports(server)[Monthly Reports] in frontend
    service alerts(server)[Alert System] in frontend

    service collector(server)[Data Collector] in processing
    service anonymizer(server)[Data Anonymizer] in processing
    service aggregator(server)[Data Aggregator] in processing

    service interactions(database)[Interaction Logs] in storage
    service trends(database)[Trend Analysis] in storage
    service metrics(database)[Usage Metrics] in storage

    service harassment(server)[Harassment Patterns] in insights
    service misinfo(server)[Misinformation Trends] in insights
    service engagement(server)[Community Engagement] in insights

    dashboard:B -- T:aggregator
    reports:B -- T:aggregator
    alerts:B -- T:aggregator

    collector:R -- L:anonymizer
    anonymizer:R -- L:aggregator

    collector:B -- T:interactions
    aggregator:B -- T:trends
    aggregator:B -- T:metrics

    aggregator:B -- T:harassment
    aggregator:B -- T:misinfo
    aggregator:B -- T:engagement