```mermaid
erDiagram
    USERS {
        string user_id PK
        string platform_type
        string preferred_language
        timestamp created_at
        timestamp last_active
        boolean anonymous_mode
    }
    
    CONVERSATIONS {
        string conversation_id PK
        string user_id FK
        string platform
        text message_content
        string intent_type
        string language_detected
        timestamp created_at
        json metadata
    }
    
    CULTURAL_CONTENT {
        string content_id PK
        string content_type
        string language
        text proverb_text
        text story_text
        string topic_category
        json cultural_context
        boolean is_active
    }
    
    FACT_CHECKS {
        string fact_id PK
        text claim_text
        string verification_status
        string source_url
        text explanation
        string language
        timestamp verified_at
        json evidence_links
    }
    
    SOS_INTERACTIONS {
        string sos_id PK
        string user_id FK
        string trigger_keyword
        string support_type
        json response_provided
        boolean escalated
        timestamp created_at
    }
    
    CAMPAIGN_CONTENT {
        string campaign_id PK
        string user_id FK
        string content_type
        text generated_content
        string media_url
        string topic
        timestamp created_at
    }
    
    ANALYTICS_EVENTS {
        string event_id PK
        string event_type
        string user_segment
        json event_data
        string language
        timestamp occurred_at
        string geographic_region
    }

    USERS ||--o{ CONVERSATIONS : "has"
    USERS ||--o{ SOS_INTERACTIONS : "requests"
    USERS ||--o{ CAMPAIGN_CONTENT : "generates"
    CONVERSATIONS }o--|| CULTURAL_CONTENT : "uses"
    CONVERSATIONS }o--|| FACT_CHECKS : "references"
    ANALYTICS_EVENTS }o--|| CONVERSATIONS : "tracks"
