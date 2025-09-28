```mermaid
architecture-beta
    group security(cloud)[Security Layer]
    group application(cloud)[Application Layer]
    group infrastructure(cloud)[Infrastructure Layer]

    service waf(server)[Web Application Firewall] in security
    service ids(server)[Intrusion Detection] in security
    service encryption(server)[Encryption Service] in security
    service audit(server)[Audit Logger] in security

    service services(server)[Core Services] in application
    service apis(server)[External APIs] in application
    service cache(database)[Cache Layer] in application

    service kubernetes(server)[Kubernetes Cluster] in infrastructure
    service database(database)[Database Cluster] in infrastructure
    service monitoring(server)[Monitoring Stack] in infrastructure
    service backup(disk)[Backup Storage] in infrastructure

    waf:B -- T:services
    ids:R -- L:services
    encryption:B -- T:cache
    audit:B -- T:monitoring

    services:B -- T:kubernetes
    apis:R -- L:kubernetes
    cache:B -- T:database

    kubernetes:B -- T:monitoring
    database:R -- L:backup