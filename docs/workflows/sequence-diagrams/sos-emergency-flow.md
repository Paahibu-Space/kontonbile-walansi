```mermaid
sequenceDiagram
    participant U as User
    participant SMS as SMS Gateway
    participant AG as API Gateway
    participant SOS as SOS Service
    participant SD as Support Directory
    participant NGO as NGO Partner

    Note over U,NGO: SOS Emergency Response
    
    U->>SMS: "Help - receiving harassment" 
    SMS->>AG: Emergency message
    AG->>SOS: Trigger SOS workflow
    
    SOS->>SOS: Detect trigger keywords
    SOS->>SOS: Classify emergency type
    SOS->>SD: Query available support resources
    SD-->>SOS: Return relevant contacts
    
    alt Immediate Self-Help
        SOS-->>AG: Safety guidance steps
        AG-->>SMS: "Here's how to block/report..."
    else Escalation Needed
        SOS->>NGO: Alert trusted partner
        NGO-->>SOS: Acknowledge response
        SOS-->>AG: Contact info + immediate steps
        AG-->>SMS: "Immediate help: [steps] + Contact: [NGO]"
    end