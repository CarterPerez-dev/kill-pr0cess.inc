/*
 * ©AngelaMos | 2025
 */

use axum::{
    extract::{State, Query},
    response::Html,
    Json,
};
use serde::{Deserialize, Serialize};
use crate::{
    AppState,
    utils::error::{AppError, Result},
};
use super::{RouteInfo, get_route_documentation};

#[derive(Debug, Deserialize)]
pub struct DocsQuery {
    format: Option<String>,
}

/// API documentation response
#[derive(Debug, Serialize)]
pub struct ApiDocumentation {
    pub title: String,
    pub version: String,
    pub description: String,
    pub base_url: String,
    pub endpoints: Vec<RouteInfo>,
    pub authentication: AuthInfo,
    pub rate_limiting: RateLimitInfo,
    pub response_formats: Vec<ResponseFormat>,
}

#[derive(Debug, Serialize)]
pub struct AuthInfo {
    pub required: bool,
    pub type_: String,
    pub description: String,
}

#[derive(Debug, Serialize)]
pub struct RateLimitInfo {
    pub description: String,
    pub headers: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct ResponseFormat {
    pub name: String,
    pub content_type: String,
    pub description: String,
}

/// Get API documentation in JSON format
pub async fn get_api_docs_json(
    State(state): State<AppState>,
    Query(query): Query<DocsQuery>,
) -> Result<Json<ApiDocumentation>> {
    let documentation = ApiDocumentation {
        title: "Dark Performance Showcase API".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        description: "High-performance Rust backend for computational visualization and GitHub integration".to_string(),
        base_url: state.config.api_base_url(),
        endpoints: get_route_documentation(),
        authentication: AuthInfo {
            required: false,
            type_: "None".to_string(),
            description: "Most endpoints are public. GitHub endpoints may have higher rate limits with authentication.".to_string(),
        },
        rate_limiting: RateLimitInfo {
            description: "Rate limiting is applied per endpoint type. Check response headers for current limits.".to_string(),
            headers: vec![
                "X-RateLimit-Limit".to_string(),
                "X-RateLimit-Remaining".to_string(),
                "X-RateLimit-Reset".to_string(),
            ],
        },
        response_formats: vec![
            ResponseFormat {
                name: "JSON".to_string(),
                content_type: "application/json".to_string(),
                description: "Default response format for all endpoints".to_string(),
            },
            ResponseFormat {
                name: "Binary".to_string(),
                content_type: "application/octet-stream".to_string(),
                description: "Used for fractal image data and binary responses".to_string(),
            },
        ],
    };

    Ok(Json(documentation))
}

/// Get API documentation in HTML format (interactive docs)
pub async fn get_api_docs_html(
    State(state): State<AppState>,
) -> Result<Html<String>> {
    let html = generate_html_documentation(&state).await?;
    Ok(Html(html))
}

/// Generate comprehensive HTML documentation
async fn generate_html_documentation(state: &AppState) -> Result<String> {
    let docs = ApiDocumentation {
        title: "Dark Performance Showcase API".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        description: "High-performance Rust backend for computational visualization and GitHub integration".to_string(),
        base_url: state.config.api_base_url(),
        endpoints: get_route_documentation(),
        authentication: AuthInfo {
            required: false,
            type_: "None".to_string(),
            description: "Most endpoints are public. GitHub endpoints may have higher rate limits with authentication.".to_string(),
        },
        rate_limiting: RateLimitInfo {
            description: "Rate limiting is applied per endpoint type. Check response headers for current limits.".to_string(),
            headers: vec![
                "X-RateLimit-Limit".to_string(),
                "X-RateLimit-Remaining".to_string(),
                "X-RateLimit-Reset".to_string(),
            ],
        },
        response_formats: vec![
            ResponseFormat {
                name: "JSON".to_string(),
                content_type: "application/json".to_string(),
                description: "Default response format for all endpoints".to_string(),
            },
        ],
    };

    let html = format!(r#"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{} - API Documentation</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
            background: #000;
            color: #f5f5f5;
            line-height: 1.6;
            overflow-x: hidden;
        }}
        
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }}
        
        .header {{
            text-align: center;
            margin-bottom: 3rem;
            border-bottom: 1px solid #333;
            padding-bottom: 2rem;
        }}
        
        .title {{
            font-size: 3rem;
            font-weight: 100;
            letter-spacing: -0.02em;
            background: linear-gradient(135deg, #22d3ee, #6366f1);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 1rem;
        }}
        
        .subtitle {{
            font-size: 1.2rem;
            color: #a3a3a3;
            font-weight: 300;
        }}
        
        .version {{
            display: inline-block;
            background: rgba(34, 211, 238, 0.1);
            border: 1px solid rgba(34, 211, 238, 0.3);
            padding: 0.25rem 0.75rem;
            border-radius: 4px;
            font-size: 0.875rem;
            margin-top: 1rem;
        }}
        
        .section {{
            margin-bottom: 3rem;
        }}
        
        .section-title {{
            font-size: 1.5rem;
            font-weight: 500;
            margin-bottom: 1rem;
            color: #22d3ee;
            border-left: 3px solid #22d3ee;
            padding-left: 1rem;
        }}
        
        .endpoint {{
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            transition: all 0.3s ease;
        }}
        
        .endpoint:hover {{
            background: rgba(255, 255, 255, 0.04);
            border-color: rgba(34, 211, 238, 0.2);
            transform: translateY(-2px);
        }}
        
        .method {{
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            margin-right: 1rem;
        }}
        
        .method.get {{
            background: rgba(52, 211, 153, 0.2);
            color: #34d399;
            border: 1px solid rgba(52, 211, 153, 0.3);
        }}
        
        .method.post {{
            background: rgba(251, 146, 60, 0.2);
            color: #fb923c;
            border: 1px solid rgba(251, 146, 60, 0.3);
        }}
        
        .path {{
            font-family: 'SF Mono', Monaco, monospace;
            font-size: 1.1rem;
            color: #f5f5f5;
        }}
        
        .description {{
            color: #a3a3a3;
            margin: 1rem 0;
        }}
        
        .parameters {{
            margin-top: 1rem;
        }}
        
        .parameter {{
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 4px;
            padding: 0.75rem;
            margin-bottom: 0.5rem;
        }}
        
        .parameter-name {{
            color: #22d3ee;
            font-weight: 600;
        }}
        
        .parameter-type {{
            color: #6366f1;
            font-size: 0.875rem;
        }}
        
        .parameter-required {{
            color: #f87171;
            font-size: 0.75rem;
            text-transform: uppercase;
        }}
        
        .rate-limit {{
            background: rgba(168, 85, 247, 0.1);
            border: 1px solid rgba(168, 85, 247, 0.2);
            border-radius: 4px;
            padding: 0.5rem;
            font-size: 0.875rem;
            margin-top: 1rem;
        }}
        
        .info-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-top: 2rem;
        }}
        
        .info-card {{
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 8px;
            padding: 1.5rem;
        }}
        
        .info-card h3 {{
            color: #22d3ee;
            margin-bottom: 1rem;
            font-size: 1.1rem;
        }}
        
        .response-type {{
            color: #6366f1;
            font-family: 'SF Mono', Monaco, monospace;
            font-size: 0.875rem;
            background: rgba(99, 102, 241, 0.1);
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            display: inline-block;
            margin-top: 0.5rem;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">{}</h1>
            <p class="subtitle">{}</p>
            <div class="version">Version {}</div>
        </div>
        
        <div class="info-grid">
            <div class="info-card">
                <h3>Base URL</h3>
                <p>{}</p>
            </div>
            <div class="info-card">
                <h3>Authentication</h3>
                <p>{}</p>
            </div>
            <div class="info-card">
                <h3>Rate Limiting</h3>
                <p>{}</p>
            </div>
        </div>
        
        <div class="section">
            <h2 class="section-title">API Endpoints</h2>
            {}
        </div>
    </div>
</body>
</html>
    "#, 
        docs.title,
        docs.title, 
        docs.description, 
        docs.version,
        docs.base_url,
        docs.authentication.description,
        docs.rate_limiting.description,
        generate_endpoints_html(&docs.endpoints)
    );

    Ok(html)
}

fn generate_endpoints_html(endpoints: &[RouteInfo]) -> String {
    endpoints.iter().map(|endpoint| {
        let method_class = endpoint.method.to_lowercase();
        let parameters_html = if endpoint.parameters.is_empty() {
            String::new()
        } else {
            format!(
                r#"<div class="parameters">
                    <h4 style="margin-bottom: 0.5rem; color: #a3a3a3;">Parameters:</h4>
                    {}
                </div>"#,
                endpoint.parameters.iter().map(|param| {
                    format!(
                        r#"<div class="parameter">
                            <span class="parameter-name">{}</span>
                            <span class="parameter-type">({})</span>
                            {}
                            <div style="margin-top: 0.25rem; color: #a3a3a3; font-size: 0.875rem;">{}</div>
                        </div>"#,
                        param.name,
                        param.param_type,
                        if param.required { r#"<span class="parameter-required">Required</span>"# } else { "" },
                        param.description
                    )
                }).collect::<Vec<_>>().join("")
            )
        };

        format!(
            r#"<div class="endpoint">
                <div>
                    <span class="method {}">{}</span>
                    <span class="path">{}</span>
                </div>
                <div class="description">{}</div>
                {}
                <div class="response-type">{}</div>
                <div class="rate-limit">
                    Rate Limit: {} requests/minute (burst: {})
                </div>
            </div>"#,
            method_class,
            endpoint.method,
            endpoint.path,
            endpoint.description,
            parameters_html,
            endpoint.response_type,
            endpoint.rate_limit.requests_per_minute,
            endpoint.rate_limit.burst_size
        )
    }).collect::<Vec<_>>().join("")
}
