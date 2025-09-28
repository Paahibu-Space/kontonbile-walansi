```mermaid
architecture-beta
    group client(cloud)[Client Layer]
    group gateway(cloud)[Gateway Layer]
    group services(cloud)[Services Layer]
    group data(cloud)[Data Layer]
    group external(cloud)[External APIs]

    service whatsapp(internet)[WhatsApp] in client
    service telegram(internet)[Telegram] in client
    service sms(internet)[SMS] in client
    service voice(internet)[Voice] in client

    service lb(server)[Load Balancer] in gateway
    service apigw(server)[API Gateway] in gateway
    service auth(server)[Auth Service] in gateway

    service nlp(server)[NLP Service] in services
    service ai(server)[AI Teacher] in services
    service factcheck(server)[Fact Check] in services
    service sos(server)[SOS Service] in services

    service userdb(database)[User DB] in data
    service convdb(database)[Conversation DB] in data
    service cache(database)[Redis Cache] in data
    service storage(disk)[Media Storage] in data

    service dubawa(internet)[Fact Check API] in external
    service whatsappapi(internet)[WhatsApp API] in external

    whatsapp:B -- T:lb
    telegram:B -- T:lb
    sms:B -- T:lb
    voice:B -- T:lb

    lb:B -- T:apigw
    apigw:R -- L:auth

    apigw:B -- T:nlp
    nlp:R -- L:ai
    nlp:R -- L:factcheck
    nlp:R -- L:sos

    ai:B -- T:convdb
    factcheck:B -- T:cache
    sos:B -- T:userdb
    ai:B -- T:storage

    factcheck:B -- T:dubawa
    whatsapp:B -- T:whatsappapi