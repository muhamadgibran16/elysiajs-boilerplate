import { Elysia } from "elysia";

// ─── Threat Pattern Definitions ───────────────────────────────────────────────

const SQL_INJECTION_PATTERN =
	/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|EXEC|EXECUTE|UNION|INTO|FROM|WHERE|HAVING|ORDER\s+BY|GROUP\s+BY|DECLARE|CAST|CONVERT)\b.*(\b(SELECT|FROM|WHERE|INTO|TABLE|DATABASE|SCHEMA)\b|--|#|\/\*)|('(\s*)(OR|AND)(\s+)[\w']+((\s*)=(\s*)[\w']+|(\s+)(LIKE|IN)\b))|(\b(OR|AND)\b\s+\d+\s*=\s*\d+)|(;\s*(DROP|ALTER|DELETE|UPDATE|INSERT|CREATE|EXEC))|(--\s*$)|(\/\*[\s\S]*?\*\/))/i;

const XSS_PATTERN =
	/(<\s*script[\s>]|<\s*\/\s*script\s*>|javascript\s*:|vbscript\s*:|on(error|load|click|mouseover|mouseout|mouseenter|mouseleave|focus|blur|submit|change|input|keydown|keyup|keypress|dblclick|contextmenu|drag|dragstart|dragend|dragover|drop|touchstart|touchend|touchmove|abort|animationend|animationstart)\s*=|<\s*img[^>]+src\s*=\s*["']?\s*javascript|<\s*iframe|<\s*embed|<\s*object|<\s*form|<\s*svg[^>]*on\w+\s*=|expression\s*\(|url\s*\(\s*["']?\s*javascript|data\s*:\s*text\/html)/i;

const PATH_TRAVERSAL_PATTERN =
	/(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\/|\.\.%2f|%2e%2e%5c|%2e%2e\\|\.\.%5c|%252e%252e|\.\.%00|%00\.\.\/)|(\/etc\/(passwd|shadow|hosts|resolv\.conf))|(\/proc\/self)|(\\windows\\system32)/i;

const COMMAND_INJECTION_PATTERN =
	/(;\s*\b(ls|cat|rm|mv|cp|wget|curl|bash|sh|zsh|python|perl|ruby|nc|ncat|netcat|whoami|id|uname|chmod|chown|kill|shutdown|reboot|passwd|ping|traceroute|nslookup|dig)\b)|(\|\s*\b(ls|cat|rm|mv|cp|wget|curl|bash|sh|python|perl|nc|whoami|id|uname)\b)|(`[^`]*`)|(\$\([^)]*\))|(\$\{[^}]*\})/i;

const LDAP_INJECTION_PATTERN =
	/(\)\s*\(\s*(cn|uid|objectClass|sAMAccountName|mail|dn)\s*=)|(\*\s*\(\s*objectClass\s*=\s*\*\s*\))|(\)\s*\(\|\s*\()|(\x00|\x0a|\x0d)/i;

const CRLF_INJECTION_PATTERN = /(%0d%0a|%0d|%0a|\r\n|\r|\n)/i;

// Suspicious file extensions that should never be accessed on an API server
const SUSPICIOUS_EXTENSION_PATTERN =
	/\.(php[0-9]?|asp|aspx|jsp|jspx|cgi|pl|py|rb|sh|bash|cmd|bat|exe|dll|com|msi|wsf|hta|txt|log|sql|bak|backup|old|orig|save|swp|swo|tmp|temp|dist|cfg|ini|conf|config|env|htaccess|htpasswd|gitignore|npmrc|DS_Store|yml|yaml|xml|properties|toml|war|jar|rar|zip|tar|gz|7z)$/i;

// NoSQL Injection — MongoDB operators in values
const NOSQL_INJECTION_PATTERN =
	/(\$(?:gt|gte|lt|lte|ne|eq|in|nin|regex|exists|type|mod|where|all|size|elemMatch|not|nor|or|and|set|unset|inc|push|pull|rename|bit|pop|addToSet|each|slice|sort|natural|text|search|expr|jsonSchema|merge|out|lookup|group|project|match|limit|skip|sample|replaceRoot|redact|currentOp|listCollections|listDatabases|collStats|dbStats)\b)/i;

// Null Byte Injection
const NULL_BYTE_PATTERN = /(%00|\\x00|\\0|\\u0000)/i;

// Prototype Pollution — dangerous object keys
const PROTOTYPE_POLLUTION_KEYS = new Set([
	"__proto__",
	"constructor",
	"prototype",
]);

// Known scanner/bot user-agent signatures
const SCANNER_BOT_PATTERN =
	/\b(sqlmap|nikto|nmap|nessus|openvas|w3af|wpscan|acunetix|netsparker|burpsuite|burp\s*suite|dirbuster|gobuster|ffuf|feroxbuster|nuclei|jaeles|masscan|zmap|shodan|censys|metasploit|havij|pangolin|webscarab|paros|arachni|skipfish|wapiti|vega|grabber|fimap|whatweb|joomscan|droopescan|wfuzz|hydra|medusa|patator|amap|httprint|httprecon)\b/i;

// HTTP methods that should be blocked (dangerous/unused)
const BLOCKED_HTTP_METHODS = new Set([
	"TRACE",
	"TRACK",
	"CONNECT",
	"PROPFIND",
	"PROPPATCH",
	"MKCOL",
	"COPY",
	"MOVE",
	"LOCK",
	"UNLOCK",
	"SEARCH",
]);

// Common headers that should be skipped from deep scanning
const SAFE_HEADERS = new Set([
	"host",
	"connection",
	"accept",
	"accept-language",
	"accept-encoding",
	"content-type",
	"content-length",
	"origin",
	"referer",
	"user-agent",
	"sec-fetch-dest",
	"sec-fetch-mode",
	"sec-fetch-site",
	"sec-ch-ua",
	"sec-ch-ua-mobile",
	"sec-ch-ua-platform",
	"cache-control",
	"pragma",
	"dnt",
	"upgrade-insecure-requests",
	"if-none-match",
	"if-modified-since",
]);

// ─── Detection Functions ──────────────────────────────────────────────────────

interface ThreatResult {
	detected: boolean;
	category?: string;
	location?: string;
}

function checkValue(value: string, location: string, skipXss: boolean = false): ThreatResult | null {
	if (!value || typeof value !== "string") return null;

	// Decode URL encoding for thorough detection
	let decoded: string;
	try {
		decoded = decodeURIComponent(value);
	} catch {
		decoded = value;
	}

	const targets = [value, decoded];

	for (const target of targets) {
		if (SQL_INJECTION_PATTERN.test(target)) {
			return { detected: true, category: "SQL Injection", location };
		}
		// Skip XSS check for body (allows legitimate HTML content like rich text)
		if (!skipXss && XSS_PATTERN.test(target)) {
			return { detected: true, category: "XSS", location };
		}
		if (COMMAND_INJECTION_PATTERN.test(target)) {
			return {
				detected: true,
				category: "Command Injection",
				location,
			};
		}
		if (LDAP_INJECTION_PATTERN.test(target)) {
			return { detected: true, category: "LDAP Injection", location };
		}
		if (NOSQL_INJECTION_PATTERN.test(target)) {
			return { detected: true, category: "NoSQL Injection", location };
		}
		if (NULL_BYTE_PATTERN.test(target)) {
			return { detected: true, category: "Null Byte Injection", location };
		}
	}

	return null;
}

function scanObject(
	obj: unknown,
	location: string,
	depth: number = 0,
	skipXss: boolean = false,
): ThreatResult | null {
	if (depth > 10) return null; // Prevent infinite recursion

	if (typeof obj === "string") {
		return checkValue(obj, location, skipXss);
	}

	if (Array.isArray(obj)) {
		for (let i = 0; i < obj.length; i++) {
			const result = scanObject(obj[i], `${location}[${i}]`, depth + 1, skipXss);
			if (result) return result;
		}
		return null;
	}

	if (obj && typeof obj === "object") {
		for (const [key, val] of Object.entries(obj)) {
			// Check for Prototype Pollution attempts
			if (PROTOTYPE_POLLUTION_KEYS.has(key)) {
				return {
					detected: true,
					category: "Prototype Pollution",
					location: `${location}.key(${key})`,
				};
			}

			// Check the key itself
			const keyResult = checkValue(key, `${location}.key(${key})`, skipXss);
			if (keyResult) return keyResult;

			// Check the value
			const valResult = scanObject(val, `${location}.${key}`, depth + 1, skipXss);
			if (valResult) return valResult;
		}
	}

	return null;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function blocked(set: any, message: string) {
	set.status = 403;
	return {
		success: false,
		message,
		errors: null,
	};
}

// ─── Elysia Plugin ────────────────────────────────────────────────────────────

export const requestGuardPlugin = new Elysia({ name: "request-guard-plugin" })
	.onBeforeHandle({ as: "global" }, ({ request, set, query, body, headers }) => {
		const url = new URL(request.url);

		// 0. Block dangerous HTTP methods (TRACE, TRACK, CONNECT, WebDAV, etc.)
		if (BLOCKED_HTTP_METHODS.has(request.method.toUpperCase())) {
			console.warn(
				`[RequestGuard] BLOCKED HTTP Method: ${request.method}`,
			);
			set.status = 405;
			return {
				success: false,
				message: `HTTP method ${request.method} is not allowed`,
				errors: null,
			};
		}

		// 0b. Block known scanner/bot user-agents
		const userAgent = headers?.["user-agent"] || "";
		if (SCANNER_BOT_PATTERN.test(userAgent)) {
			console.warn(
				`[RequestGuard] BLOCKED Scanner Bot: ${userAgent}`,
			);
			return blocked(set, "Request blocked: suspicious client detected");
		}

		// 1. Scan URL path for path traversal
		if (PATH_TRAVERSAL_PATTERN.test(url.pathname)) {
			console.warn(
				`[RequestGuard] BLOCKED Path Traversal: ${url.pathname}`,
			);
			return blocked(set, "Request blocked: suspicious pattern detected");
		}

		// 1b. Block suspicious file extension probing (.php, .asp, .txt, .env, etc.)
		if (SUSPICIOUS_EXTENSION_PATTERN.test(url.pathname)) {
			console.warn(
				`[RequestGuard] BLOCKED Suspicious File Probe: ${url.pathname}`,
			);
			return blocked(set, "Request blocked: suspicious file access attempt");
		}

		// 1c. Null byte in URL path
		if (NULL_BYTE_PATTERN.test(url.pathname)) {
			console.warn(
				`[RequestGuard] BLOCKED Null Byte in path: ${url.pathname}`,
			);
			return blocked(set, "Request blocked: suspicious pattern detected");
		}

		// 2. Scan query parameters
		if (query && typeof query === "object") {
			const queryResult = scanObject(query, "query");
			if (queryResult) {
				console.warn(
					`[RequestGuard] BLOCKED ${queryResult.category} in ${queryResult.location}`,
				);
				return blocked(set, "Request blocked: suspicious pattern detected");
			}
		}

		// 3. Scan headers (only custom/non-standard headers for injection)
		if (headers && typeof headers === "object") {
			for (const [key, value] of Object.entries(headers)) {
				if (SAFE_HEADERS.has(key.toLowerCase())) continue;
				if (typeof value !== "string") continue;

				// Check for CRLF injection in headers
				if (CRLF_INJECTION_PATTERN.test(value)) {
					console.warn(
						`[RequestGuard] BLOCKED CRLF Injection in header: ${key}`,
					);
					return blocked(set, "Request blocked: suspicious pattern detected");
				}

				// Check for other injection patterns in custom headers
				const headerResult = checkValue(value, `header.${key}`);
				if (headerResult) {
					console.warn(
						`[RequestGuard] BLOCKED ${headerResult.category} in ${headerResult.location}`,
					);
					return blocked(set, "Request blocked: suspicious pattern detected");
				}
			}
		}

		// 4. Scan request body (if present and parsed)
		// Note: XSS check is skipped for body to allow legitimate HTML content
		// (e.g., rich text editors, HTML emails, template content)
		if (body !== undefined && body !== null) {
			const bodyResult = scanObject(body, "body", 0, true);
			if (bodyResult) {
				console.warn(
					`[RequestGuard] BLOCKED ${bodyResult.category} in ${bodyResult.location}`,
				);
				return blocked(set, "Request blocked: suspicious pattern detected");
			}
		}
	});
