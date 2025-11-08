```mermaid
sequenceDiagram
    participant U as User
    participant TG as Telegram
    participant AG as API Gateway
    participant FC as Fact-Check Service
    participant GFCA as Google Fact Check API
    participant C as Cache

    Note over U,C: Fact-Checking Workflow
    
    U->>TG: Forward suspicious news article
    TG->>AG: Message with article content
    AG->>FC: Fact-check request
    
    FC->>C: Check cache for previous verification
    alt Cache Hit
        C-->>FC: Return cached result
    else Cache Miss
        FC->>FC: Extract claim text from message
        FC->>GFCA: Query Google Fact Check API
        GFCA-->>FC: Verification results with ratings
        
        FC->>FC: Process and format results
        FC->>C: Store in cache
    end
    
    FC-->>AG: Verification status (False/Misleading/True)
    AG-->>TG: Formatted fact-check card
    TG-->>U: "❌ This claim is FALSE. Here's why..."