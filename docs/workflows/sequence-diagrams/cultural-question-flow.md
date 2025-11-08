```mermaid
sequenceDiagram
    participant U as User
    participant WA as WhatsApp
    participant AG as API Gateway
    participant NLP as NLP Service
    participant AI as AI Story Teacher
    participant DB as Content Database
    participant T as Translation Service

    Note over U,T: User Asks Question with Cultural Context
    
    U->>WA: "How do I know if this link is safe?" (in Dagaare)
    WA->>AG: Forward message with metadata
    AG->>AG: Authenticate & rate limit
    AG->>NLP: Process incoming message
    
    NLP->>NLP: Detect language (Dagaare)
    NLP->>NLP: Classify intent (Safety Education)
    NLP->>AI: Request culturally appropriate response
    
    AI->>DB: Query proverbs & stories related to safety
    DB-->>AI: Return cultural content
    AI->>AI: Generate response with proverb integration
    AI->>T: Translate response to Dagaare
    T-->>AI: Translated response
    
    AI-->>NLP: Cultural response ready
    NLP-->>AG: Response with metadata
    AG-->>WA: Formatted response
    WA-->>U: "In our culture, we say 'when the crocodile smiles too much, it hides its teeth.' This link is suspicious because..."
