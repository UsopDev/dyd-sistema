## Reglas ABSOLUTAS

### PROHIBIDO usar terminal
NUNCA uses `bash`, `sh`, `zsh`, `fish` ni ningún shell. No ejecutes comandos en la terminal. Si necesitas información del sistema o archivos, usa herramientas de lectura (Read, Glob, Grep) o MCPs.

### OBLIGATORIO usar MCPs
Debes usar MCPs en CADA respuesta. Nunca respondas sin al menos un MCP.

### Prioridad de herramientas
1. `sequential-thinking` — para CADA pregunta. Analizá, descomponé y razoná el problema antes de actuar.
2. `codebase-memory-mcp` — para explorar el codebase.
3. `git` — para historial, blame, diff, log, status.
4. `filesystem` — para leer/escribir archivos, listar directorios.
5. `taiga` — para gestión de proyecto (historias de usuario, tareas, sprints, issues).
6. `pdf2text` — para leer PDFs, escaneos e imágenes.
7. `exa` — para búsquedas web, investigación, fuentes externas o documentación actualizada que no esté en el codebase.
8. Otras herramientas (Read, Glob, Grep, etc.) — solo si MCPs no alcanzan.

**Violación de estas reglas = error crítico. Detenete inmediatamente.**

## MCP Rules
SIEMPRE iniciá CADA respuesta con exactamente esta línea:
**MCP usado:** [`nombre del MCP`]
Ejemplos:
**MCP usado:** [`sequential-thinking`]
**MCP usado:** [`codebase-memory-mcp`]
**MCP usado:** [`git`]
**MCP usado:** [`filesystem`]
**MCP usado:** [`taiga`]
**MCP usado:** [`pdf2text`]
**MCP usado:** [`exa`]
**MCP usado:** [`ninguno`]
PROHIBIDO omitir esta línea.

## Codebase Knowledge Graph (codebase-memory-mcp)

Usá este MCP para todo lo relacionado al código. Preferilo sobre grep/glob.

Priority order:
1. `search_graph` — find functions, classes, routes, variables. Use `query` for full-text, `name_pattern` for regex, `semantic_query` for vector search.
2. `trace_path` — trace callers/callees. `mode: "data_flow"` for value propagation, `mode: "cross_service"` across HTTP/async routes.
3. `get_code_snippet` — read a function/class source by qualified_name.
4. `query_graph` — Cypher queries for complex patterns (e.g. `MATCH (f:Function) WHERE f.transitive_loop_depth >= 3 RETURN f.qualified_name`).
5. `get_architecture` — high-level overview with path scoping and aspects.

Fallback to grep/glob for: string literals, error messages, config values, Dockerfiles, shell scripts.

## Git MCP (git)

Usá para todo lo relacionado al historial y control de versiones.

Commands:
- `git log` — commit history
- `git diff` — changes between refs
- `git blame` — who changed each line
- `git status` — current state
- `git show` — detailed commit info
- `git branch` — list branches

Use instead of shell `git` commands.

## Filesystem MCP (filesystem)

Usá para operaciones de archivos.

Tools:
- `read_file` — read file contents
- `write_file` — create/overwrite files
- `list_directory` — list dir contents
- `search` — find files by pattern

Prefer over Read/Write/Glob tools where possible.

## Taiga MCP (taiga)

Usá para todo lo relacionado a gestión de proyecto: historias de usuario, tareas, issues, épicas y sprints.

Tools (verificá los nombres exactos en tu servidor):
- Listar proyectos, sprints, historias de usuario, tareas e issues.
- Crear y actualizar historias de usuario, tareas e issues.
- Cambiar estado, asignar responsable y comentar.

Reglas:
- Antes de crear algo, listá lo existente para no duplicar.
- Antes de modificar o cerrar un elemento, confirmá con el usuario.
- No inventes IDs ni referencias de proyecto: consultalos.
- Nunca borres elementos sin confirmación explícita.

## PDF2Text MCP (pdf2text)

Usá para leer PDFs, escaneos e imágenes. Preferilo sobre cualquier otra forma de leer documentos.

Tools:
- `extract_text` — devuelve texto/Markdown, info de páginas y advertencias.
- `list_engines` — muestra los motores disponibles.

Reglas:
- Solo accede a los directorios permitidos con `--allow-dir`. Si un PDF está fuera, avisá al usuario; no intentes otra ruta.
- Usá rutas absolutas.
- En modo `auto` el OCR se limita a 12 páginas. Para escaneos completos pedí el motor explícito (`paddleocr`; `vision` solo existe en macOS).
- Si la respuesta trae advertencias o páginas omitidas, reportalas al usuario. No asumas que el texto está completo.
- Límites: 200 páginas y 80 MB por PDF.
- Los PDFs con texto nativo se leen sin OCR. Si el resultado sale vacío o ilegible, probablemente es un escaneo.

## Exa MCP (exa)

Usá para investigación web, búsqueda de fuentes externas, documentación de librerías/frameworks, o cualquier información que no esté en el codebase local.

Tools:
- `web_search_exa` — búsqueda web general, devuelve contenido limpio y listo para usar.
- `web_fetch_exa` — lee el contenido completo de una o más URLs en Markdown limpio.

Usá `exa` en vez de asumir o inventar información sobre librerías, APIs externas, versiones, changelogs, etc. Si la tarea requiere verificar algo que cambia con el tiempo (versión de un paquete, breaking changes, documentación oficial), consultá `exa` antes de responder.

## Workflow

Al recibir una tarea:

1. **sequential-thinking** — always. Analyze the problem, break it down, plan the approach.
2. **codebase-memory-mcp** — if the task involves code, explore the relevant parts.
3. **git** — check history, blame, diff, log if relevant.
4. **filesystem** — read/write files as needed.
5. **taiga** — si la tarea involucra historias de usuario, tareas, sprints o issues.
6. **pdf2text** — si la tarea requiere leer un PDF, escaneo o imagen con texto.
7. **exa** — si la tarea requiere info externa actualizada (docs, versiones, breaking changes, referencias) que no está en el codebase.
8. **Responder** — start with `**MCP usado:**` line.
9. **No bash** — never.

<!-- context7 -->
Use Context7 MCP to fetch current documentation whenever the user asks about a library, framework, SDK, API, CLI tool, or cloud service — even well-known ones like React, Next.js, Prisma, Express, Tailwind, Django, or Spring Boot. This includes API syntax, configuration, version migration, porting code between libraries, platforms, or SQL dialects, library-specific debugging, setup instructions, and CLI tool usage. Use even when you think you know the answer — your training data may not reflect recent changes. Prefer this over web search for library docs.

Do not use for: refactoring, debugging, or reviewing code that does not depend on a library or platform API, or general programming concepts.

## Steps

1. Always start with `resolve-library-id` using the library name and what to look up in the library's documentation, unless the user provides an exact library ID in `/org/project` format
2. Pick the best match (ID format: `/org/project`) by: exact name match, description relevance, code snippet count, source reputation (High/Medium preferred), and benchmark score (higher is better). If results don't look right, try alternate names or queries (e.g., "next.js" not "nextjs", or rephrase the question). Use version-specific IDs when the user mentions a version
3. `query-docs` with the selected library ID and what to look up in the library's documentation (not single words), scoped to a single concept. If the question spans multiple distinct concepts (e.g. routing and auth and caching), make a separate `query-docs` call per concept with the same library ID, unless the question is about how the concepts interact — combined queries dilute ranking and return shallow results for each topic
4. Answer using the fetched docs
<!-- context7 -->
