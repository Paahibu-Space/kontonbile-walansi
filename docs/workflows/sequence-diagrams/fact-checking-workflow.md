```mermaid
sequenceDiagram
    participant U as User
    participant TG as Telegram
    participant AG as API Gateway
    participant FC as Fact-Check Service
    participant DA as Dubawa API
    participant AC as Africa Check API
    participant C as Cache

    Note over U,C: Fact-Checking Workflow
    
    U->>TG: Forward suspicious news article
    TG->>AG: Message with article content
    AG->>FC: Fact-check request
    
    FC->>C: Check cache for previous verification
    alt Cache Hit
        C-->>FC: Return cached result
    else Cache Miss
        FC->>DA: Query Dubawa API
        FC->>AC: Query Africa Check API
        
        par Parallel API calls
            DA-->>FC: Verification result
        and
            AC-->>FC: Cross-verification
        end
        
        FC->>FC: Aggregate results
        FC->>C: Store in cache
    end
    
    FC-->>AG: Verification status (False/Misleading)
    AG-->>TG: Formatted fact-check card
    TG-->>U: "❌ This claim is FALSE. Here's why..."