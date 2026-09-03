#!/usr/bin/env node

/**
 * Build the compact field catalog (manifest.json) used by the FrigateConfigMock
 * Vue component in the Vitepress documentation.
 *
 * This script reads the JSON schema, i18n translations and section configs from
 * the official Frigate repository (cloned by script/clone-frigate.sh) and
 * produces a single manifest.json file consumed by the documentation UI mock.
 *
 * Translations are loaded from the zh-CN locale so the generated manifest is
 * fully localized for the Chinese documentation site.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const docsRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(docsRoot, ".frigate");

// config-schema.json is generated from the Frigate Python backend and kept as
// a checked-in static file under script/. Update it manually when the Frigate
// config model changes (see script/README.md for instructions).
const schemaPath = path.join(scriptDir, "config-schema.json");
const localeRoot = path.join(repoRoot, "web/public/locales/zh-CN/config");
const sectionConfigRoot = path.join(
  repoRoot,
  "web/src/components/config-form/section-configs",
);
const settingsSourcePath = path.join(repoRoot, "web/src/pages/Settings.tsx");
const settingsLocalePath = path.join(
  repoRoot,
  "web/public/locales/zh-CN/views/settings.json",
);
const outputPath = path.join(
  docsRoot,
  ".vitepress/theme/components/FrigateConfigMock/manifest.json",
);

// Fallback to English when a zh-CN key is missing.
const fallbackLocaleRoot = path.join(repoRoot, "web/public/locales/en/config");
const fallbackSettingsLocalePath = path.join(
  repoRoot,
  "web/public/locales/en/views/settings.json",
);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function loadLocale(filePath, fallbackPath) {
  if (fs.existsSync(filePath)) return readJson(filePath);
  if (fallbackPath && fs.existsSync(fallbackPath)) return readJson(fallbackPath);
  return {};
}

const schema = readJson(schemaPath);
const translations = {
  global: loadLocale(
    path.join(localeRoot, "global.json"),
    path.join(fallbackLocaleRoot, "global.json"),
  ),
  camera: loadLocale(
    path.join(localeRoot, "cameras.json"),
    path.join(fallbackLocaleRoot, "cameras.json"),
  ),
  groups: loadLocale(
    path.join(localeRoot, "groups.json"),
    path.join(fallbackLocaleRoot, "groups.json"),
  ),
};
const settingsTranslations = loadLocale(
  settingsLocalePath,
  fallbackSettingsLocalePath,
);

function resolveNode(node) {
  if (!node || typeof node !== "object") return {};

  if (node.$ref) {
    const refName = node.$ref.split("/").at(-1);
    return {
      ...resolveNode(schema.$defs?.[refName]),
      ...node,
      $ref: undefined,
    };
  }

  const variants = node.anyOf ?? node.oneOf;
  if (Array.isArray(variants)) {
    const concrete = variants.find((variant) => variant.type !== "null");
    return {
      ...resolveNode(concrete),
      ...node,
      anyOf: undefined,
      oneOf: undefined,
    };
  }

  return node;
}

function translationAt(level, section, fieldPath) {
  let current = translations[level]?.[section];
  for (const segment of fieldPath) {
    if (!current || typeof current !== "object") return {};
    current = current[segment];
  }
  return current && typeof current === "object" ? current : {};
}

function inferWidget(node) {
  if (Array.isArray(node.enum)) return "select";
  if (node.type === "boolean") return "switch";
  if (
    ["integer", "number"].includes(node.type) &&
    node.minimum !== undefined &&
    (node.maximum !== undefined || node.exclusiveMaximum !== undefined)
  ) {
    return "range";
  }
  if (node.type === "integer" || node.type === "number") return "number";
  if (node.type === "array") return "tags";
  if (node.type === "object") return "object";
  return "text";
}

function extractArray(source, key) {
  const match = source.match(new RegExp(`${key}\\s*:\\s*\\[([\\s\\S]*?)\\]`));
  return match
    ? [...match[1].matchAll(/["']([^"']+)["']/g)].map((item) => item[1])
    : [];
}

function extractObjectBlock(source, key) {
  const match = new RegExp(`\\b${key}\\s*:\\s*\\{`).exec(source);
  if (!match) return "";
  const start = source.indexOf("{", match.index);
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (['"', "'", "`"].includes(character)) {
      quote = character;
      continue;
    }
    if (character === "{") depth += 1;
    if (character === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start + 1, index);
    }
  }
  return "";
}

function extractGroups(source) {
  const fieldGroups = {};
  const groupsBlock = extractObjectBlock(source, "fieldGroups");
  for (const match of groupsBlock.matchAll(/(\w+)\s*:\s*\[([\s\S]*?)\]/g)) {
    fieldGroups[match[1]] = [...match[2].matchAll(/["']([^"']+)["']/g)].map(
      (item) => item[1],
    );
  }
  return fieldGroups;
}

/**
 * Parse the `uiSchema` block from a section config source string and extract
 * the `enumI18nPrefix` option for each field. Returns a map of
 * { fieldName: "i18n.prefix" }.
 *
 * Handles both flat keys with dots (e.g. "alerts.retain.mode") and nested
 * objects (e.g. preview: { quality: { "ui:options": { enumI18nPrefix: ... } } }).
 */
/**
 * Map uiSchema widget/field declarations from the section configs to the
 * mock widget ids used by the Vue components. Mirrors the registry wiring in
 * web/src/components/config-form/theme/frigateTheme.ts.
 */
const UI_WIDGET_MAP = {
  // "ui:widget" registry names (frigateTheme.ts) — capitalised
  FfmpegArgsWidget: "ffmpegArgs",
  ArrayAsTextWidget: "arrayAsText",
  // helper factory function names in ffmpeg.ts — lower-case first letter
  ffmpegArgsWidget: "ffmpegArgs",
  arrayAsTextWidget: "arrayAsText",
};

const UI_FIELD_MAP = {
  CameraInputsField: "cameraInputs",
};

/**
 * Widget ids declared per-field inside section configs whose multi-instance
 * form uses "*" wildcard keys (e.g. "*.roles" in genai.ts). Applied to every
 * expanded instance field by name.
 */
const MULTI_INSTANCE_WIDGETS = {
  genaiRoles: "genaiRoles",
  genaiModel: "genaiModel",
  DictAsYamlField: "DictAsYamlField",
};

/**
 * Widget ids the Vue mock actually implements.
 */
const IMPLEMENTED_WIDGETS = [
  "ffmpegArgs",
  "cameraInputs",
  "inputRoles",
  "genaiRoles",
  "genaiModel",
  "DictAsYamlField",
];

/**
 * Wildcard uiSchema declarations ('*.roles': { ... }) from a section config:
 * { fieldName (without *) -> mock widget id }.
 */
function extractWildcardWidgets(source) {
  const result = {};
  for (const match of source.matchAll(
    /"\*\.(\w+)"\s*:\s*\{[\s\S]{0,300}?"ui:(?:widget|field)":\s*"([^"]+)"/g,
  )) {
    const mapped =
      MULTI_INSTANCE_WIDGETS[match[2]] ??
      UI_WIDGET_MAP[match[2]] ??
      UI_FIELD_MAP[match[2]];
    if (mapped) result[match[1]] = mapped;
  }
  return result;
}

/**
 * Parse the uiSchema of a section config into { fieldName -> mock widget }.
 * Two declaration styles exist upstream:
 *   1. helper factories in ffmpeg.ts:  input_args: ffmpegArgsWidget("...")
 *   2. inline strings elsewhere:       "export.hwaccel_args": {
 *                                         "ui:widget": "FfmpegArgsWidget" }
 * Nested plain-object keys (output_args: { record: ... }) resolve relative
 * to their parent, so the scan descends into nested object literals and
 * emits both leaf and full-path variants; lookup prefers the longest key.
 */
function extractWidgetHints(source) {
  const result = {};

  const extractBlock = (block, fromIndex) => {
    const start = block.indexOf("{", fromIndex);
    if (start < 0) return null;
    let depth = 0;
    let quote = null;
    let escaped = false;
    for (let j = start; j < block.length; j += 1) {
      const ch = block[j];
      if (quote) {
        if (escaped) escaped = false;
        else if (ch === "\\") escaped = true;
        else if (ch === quote) quote = null;
        continue;
      }
      if (['"', "'", "`"].includes(ch)) {
        quote = ch;
        continue;
      }
      if (ch === "{") depth += 1;
      else if (ch === "}") {
        depth -= 1;
        if (depth === 0) return block.slice(start + 1, j);
      }
    }
    return null;
  };

  // 1. helper factory invocations
  const scanHelperCalls = (block, prefix) => {
    const keyPattern =
      /(?:^|[{,\n])\s*(?:"([\w.]+)"|(\w+))\s*:\s*(?:(\w+Widget)\s*\()?/g;
    const matches = [...block.matchAll(keyPattern)];
    for (const match of matches) {
      const key = match[1] ?? match[2];
      if (!key || key === "items" || key.startsWith("ui:")) continue;
      const path = prefix ? `${prefix}.${key}` : key;
      if (match[3] && UI_WIDGET_MAP[match[3]]) {
        result[path] = UI_WIDGET_MAP[match[3]];
      } else {
        const colon = match[0].lastIndexOf(":");
        const next = block.slice(match.index + colon + 1).match(/^\s*\{/);
        if (next) {
          const inner = extractBlock(block, match.index + colon + 1);
          if (inner) scanHelperCalls(inner, path);
        }
      }
    }
  };
  scanHelperCalls(source, "");

  // 2. inline "ui:widget"/"ui:field" declarations
  const uiSchemaBlock = extractObjectBlock(source, "uiSchema");
  if (uiSchemaBlock) {
    for (const match of uiSchemaBlock.matchAll(
      /"([\w.]+)"\s*:\s*\{[^{}]*?"ui:(?:widget|field)":\s*"([^"]+)"/g,
    )) {
      const mapped = UI_WIDGET_MAP[match[2]] ?? UI_FIELD_MAP[match[2]];
      if (mapped) result[match[1]] = mapped;
    }
    for (const match of uiSchemaBlock.matchAll(
      /(?:^|[{,\n])\s*(\w+)\s*:\s*\{\s*"ui:(?:widget|field)":\s*"([^"]+)"/g,
    )) {
      const mapped = UI_WIDGET_MAP[match[2]] ?? UI_FIELD_MAP[match[2]];
      if (mapped) result[match[1]] = mapped;
    }
  }
  return result;
}

/**
 * Resolve the mock widget id for a field: prefer the longest matching hint
 * key, and only accept ids the mock implements — everything else falls back
 * to the schema inferred type.
 */
function resolveWidget(hints, key, node) {
  const hint = hints.widgets?.[key];
  if (hint && IMPLEMENTED_WIDGETS.includes(hint)) return hint;
  return inferWidget(node);
}

function extractEnumI18nPrefixes(source) {
  const result = {};
  const uiSchemaBlock = extractObjectBlock(source, "uiSchema");
  if (!uiSchemaBlock) return result;

  // 1. Flat keys with dots: "alerts.retain.mode": { ... enumI18nPrefix: ... }
  for (const match of uiSchemaBlock.matchAll(
    /"([\w.]+)"\s*:\s*\{[\s\S]*?enumI18nPrefix\s*:\s*["']([^"']+)["']/g,
  )) {
    result[match[1]] = match[2];
  }

  // 2. Simple word keys: fieldName: { "ui:options": { enumI18nPrefix: ... } }
  for (const match of uiSchemaBlock.matchAll(
    /^\s*(\w+)\s*:\s*\{/gm,
  )) {
    const fieldName = match[1];
    if (result[fieldName]) continue;
    const fieldBlock = extractObjectBlock(uiSchemaBlock, fieldName);
    // Check if enumI18nPrefix is directly in this field's options
    const directMatch = fieldBlock.match(
      /enumI18nPrefix\s*:\s*["']([^"']+)["']/,
    );
    if (directMatch) {
      result[fieldName] = directMatch[1];
      continue;
    }
    // Check nested fields (e.g. preview -> quality)
    for (const nestedMatch of fieldBlock.matchAll(
      /^\s*(\w+)\s*:\s*\{/gm,
    )) {
      const nestedName = nestedMatch[1];
      const nestedBlock = extractObjectBlock(fieldBlock, nestedName);
      const nestedPrefix = nestedBlock.match(
        /enumI18nPrefix\s*:\s*["']([^"']+)["']/,
      );
      if (nestedPrefix) result[`${fieldName}.${nestedName}`] = nestedPrefix[1];
    }
  }

  return result;
}

function loadSectionHints(section, level) {
  const configPath = path.join(sectionConfigRoot, `${section}.ts`);
  if (!fs.existsSync(configPath)) return {};
  const source = fs.readFileSync(configPath, "utf8");
  const base = extractObjectBlock(source, "base");
  const override = extractObjectBlock(source, level);
  const overrideHas = (key) => new RegExp(`\\b${key}\\s*:`).test(override);
  return {
    order: overrideHas("fieldOrder")
      ? extractArray(override, "fieldOrder")
      : extractArray(base, "fieldOrder"),
    hidden: [
      ...extractArray(base, "hiddenFields"),
      ...extractArray(base, "hiddenFields"),
      ...extractArray(override, "hiddenFields"),
    ],
    advanced: overrideHas("advancedFields")
      ? extractArray(override, "advancedFields")
      : extractArray(base, "advancedFields"),
    groups: overrideHas("fieldGroups")
      ? extractGroups(override)
      : extractGroups(base),
    docs: base.match(/sectionDocs\s*:\s*["']([^"']+)["']/)?.[1] ?? null,
    enumI18nPrefixes: {
      ...extractEnumI18nPrefixes(base),
      ...extractEnumI18nPrefixes(override),
    },
    widgets: {
      ...extractWidgetHints(base),
      ...extractWidgetHints(override),
    },
  };
}

/**
 * Upstream fieldGroups may reference a parent object key (e.g. "output_args")
 * while the manifest only stores leaf fields (output_args.detect / .record).
 * Expand such entries into their collected children so group field lists only
 * contain keys that actually exist in `fields`.
 */
function expandGroupFields(groupFields, fields) {
  const expanded = [];
  for (const key of groupFields) {
    if (fields[key]) {
      expanded.push(key);
      continue;
    }
    const children = Object.keys(fields).filter((fieldKey) =>
      fieldKey.startsWith(`${key}.`),
    );
    if (children.length) expanded.push(...children);
  }
  return expanded;
}

function groupLabel(level, section, group) {
  const domain = level === "camera" ? "cameras" : "global";
  return (
    translations.groups?.[section]?.[domain]?.[group] ??
    group.replaceAll("_", " ").replace(/^./, (value) => value.toUpperCase())
  );
}

/**
 * Resolve localized labels for a field's enum values using the
 * `enumI18nPrefix` from the section config uiSchema and the settings
 * translations. Returns a { value: label } map, or null when no prefix
 * or translations are found.
 */
function resolveEnumLabels(hints, fieldKey, enumValues) {
  if (!Array.isArray(enumValues) || !enumValues.length) return null;
  // The field key may be a dot-path (e.g. "detections.retain.mode"); the
  // uiSchema key is the last segment (e.g. "mode") for nested fields.
  const leafKey = fieldKey.split(".").at(-1);
  const prefix =
    hints.enumI18nPrefixes?.[fieldKey] ?? hints.enumI18nPrefixes?.[leafKey];
  if (!prefix) return null;
  const parts = prefix.split(".");
  let current = settingsTranslations;
  for (const part of parts) {
    if (!current || typeof current !== "object") return null;
    current = current[part];
  }
  if (!current || typeof current !== "object") return null;
  const labels = {};
  let hasAny = false;
  for (const value of enumValues) {
    const label = current[value];
    if (label) {
      labels[value] = label;
      hasAny = true;
    }
  }
  return hasAny ? labels : null;
}

function collectFields(level, section, sectionNode, hints) {
  const fields = {};

  function visit(rawNode, fieldPath = []) {
    const node = resolveNode(rawNode);
    const properties = node.properties;
    if (properties && typeof properties === "object") {
      for (const [name, child] of Object.entries(properties)) {
        visit(child, [...fieldPath, name]);
      }
      return;
    }

    if (fieldPath.length === 0) return;
    const key = fieldPath.join(".");
    const localized = translationAt(level, section, fieldPath);
    const enumValues = node.enum ?? null;
    const enumLabels = resolveEnumLabels(hints, key, enumValues);
    fields[key] = {
      label: localized.label ?? node.title ?? fieldPath.at(-1),
      description: localized.description ?? node.description ?? "",
      widget: resolveWidget(hints, key, node),
      default: node.default ?? null,
      enum: enumValues,
      enumLabels,
      minimum: node.minimum ?? node.exclusiveMinimum ?? null,
      maximum: node.maximum ?? node.exclusiveMaximum ?? null,
      advanced: hints.advanced?.includes(key) ?? false,
    };
  }

  visit(sectionNode);
  return fields;
}

/**
 * Some top-level config fields do not have their own settings page and are
 * grouped with another section in the Frigate UI. This mapping tells
 * buildLevel() to collect those fields into the "host" section so their labels
 * and descriptions are available in the manifest.
 *
 * Source: SYSTEM_SECTION_MAPPING in web/src/pages/Settings.tsx
 * (detectors + model both map to "systemDetectorsAndModel")
 */
const COMPOSITE_FIELDS = {
  // host section -> [extra top-level fields to include]
  model: ["detectors"],
};

/**
 * Sections that exist as settings pages but whose schema node has no
 * `properties` (dynamic dicts like go2rtc streams / environment_vars) or that
 * are rendered by dedicated views (uiSettings general page, profiles,
 * cameraManagement, users, roles, frigateplus, triggers, mediaSync,
 * regionGrid, motionTuner). They get hand-authored field metadata here so the
 * navigation renders a real field page instead of an empty one.
 *
 * Sources for labels/descriptions: web/public/locales/zh-CN (config/global.json
 * for schema-backed sections, views/settings.json for view-backed pages).
 */
const SYNTHETIC_SECTIONS = {
  "go2rtc_streams": {
    level: "global",
    labelKey: ["settings", "go2rtcStreams", "title"],
    descriptionKey: ["settings", "go2rtcStreams", "description"],
    docs: "/configuration/restream",
    fields: {
      "streams.my_stream": {
        label: "视频流名称",
        description: "每个视频流包含一个名称以及一个或多个源地址 URL。",
        widget: "go2rtcStreams",
        default: null,
      },
    },
  },
  "environment_vars": {
    level: "global",
    labelKey: ["global", "environment_vars", "label"],
    descriptionKey: ["global", "environment_vars", "description"],
    docs: "/configuration/advanced",
    fields: {
      "vars": {
        label: "环境变量",
        description: "键值对形式的环境变量列表，将设置到 Frigate 进程上。",
        widget: "envVars",
        default: null,
      },
    },
  },
};

/**
 * Sections whose schema node is { type: object, additionalProperties: $ref }
 * render as multi-instance pages in the real UI (add / remove named
 * instances: genai providers, detectors, camera groups, profiles, zones).
 * Expand them into a synthetic section with "my_provider.*" fields so the
 * docs mock renders the instance key row + instance fields exactly like the
 * real form — instead of hand-patching the manifest (which is lost whenever
 * the manifest is regenerated).
 */
const MULTI_INSTANCE_SECTIONS = new Set([
  "genai",
  "cameras",
  "detectors",
  "profiles",
  "camera_groups",
  "zones",
]);

function expandMultiInstanceSection(level, section, node, hints) {
  const ref = node.additionalProperties;
  const defName =
    typeof ref === "object" && ref?.$ref ? ref.$ref.split("/").at(-1) : null;
  const defNode = defName ? resolveNode(schema.$defs?.[defName] ?? {}) : node;

  const fields = {};
  for (const [name, childRaw] of Object.entries(defNode.properties ?? {})) {
    const child = resolveNode(childRaw);
    const key = `my_provider.${name}`;
    const localized = translationAt(level, section, [name]);
    const enumValues = child.enum ?? null;
    // widget: wildcard uiSchema from the section config wins (e.g. genai
    // "*.roles" → genaiRoles), then password/arrayAsText from the schema
    // format, then the regular hint/infer chain.
    const wildcardWidget = hints.wildcardWidgets?.[name];
    const formatWidget =
      child.format === "password" || child.widget === "password"
        ? "password"
        : null;
    fields[key] = {
      label: localized.label ?? child.title ?? name,
      description: localized.description ?? child.description ?? "",
      widget:
        wildcardWidget ??
        formatWidget ??
        resolveWidget(
          { widgets: hints.widgets ?? {} },
          name.replace(/^\*\./, ""),
          child,
        ),
      default: child.default ?? null,
      enum: enumValues,
      enumLabels: resolveEnumLabels(hints, name, enumValues),
      minimum: child.minimum ?? child.exclusiveMinimum ?? null,
      maximum: child.maximum ?? child.exclusiveMaximum ?? null,
      advanced: hints.advanced?.includes(`*.${name}`) ?? false,
    };
  }

  // genai.ts declares a "ui:order" list — use it to match the real
  // provider form order; otherwise keep the schema order.
  const orderSource = fs.existsSync(
    path.join(sectionConfigRoot, `${section}.ts`),
  )
    ? fs.readFileSync(path.join(sectionConfigRoot, `${section}.ts`), "utf8")
    : "";
  const orderMatch = orderSource.match(/"ui:order"\s*:\s*\[([^\]]*)\]/);
  const uiOrder = orderMatch
    ? orderMatch[1].match(/"([^"]+)"/g)?.map((v) => v.replaceAll('"', "")) ?? []
    : [];
  const orderedNames = uiOrder.length
    ? uiOrder.filter((name) => name !== "*" && fields[`my_provider.${name}`])
    : Object.keys(fields);

  const localized = translations[level]?.[section] ?? {};
  return {
    label: localized.label ?? node.title ?? section,
    description: localized.description ?? node.description ?? "",
    order: orderedNames.map((name) => `my_provider.${name}`),
    groups: [],
    docs: hints.docs ?? null,
    fields,
    multiInstance: { instanceKey: "my_provider", instanceLabel: "my_provider" },
  };
}

function buildLevel(level) {
  const rootProperties =
    level === "camera"
      ? resolveNode(schema.$defs.CameraConfig).properties
      : schema.properties;
  const result = {};

  // Synthetic sections (go2rtc_streams, environment_vars, ...) first so real
  // schema sections keep priority if keys ever collide.
  for (const [section, spec] of Object.entries(SYNTHETIC_SECTIONS)) {
    if (spec.level !== level) continue;
    result[section] = {
      label:
        spec.labelKey.reduce(
          (acc, key) => (acc?.[key] === undefined ? undefined : acc[key]),
          settingsTranslations,
        ) ??
        spec.labelKey.reduce(
          (acc, key) => (acc?.[key] === undefined ? undefined : acc[key]),
          translations,
        ) ??
        section,
      description:
        spec.descriptionKey.reduce(
          (acc, key) => (acc?.[key] === undefined ? undefined : acc[key]),
          settingsTranslations,
        ) ??
        spec.descriptionKey.reduce(
          (acc, key) => (acc?.[key] === undefined ? undefined : acc[key]),
          translations,
        ) ??
        "",
      order: Object.keys(spec.fields),
      groups: [],
      docs: spec.docs ?? null,
      fields: JSON.parse(JSON.stringify(spec.fields)),
    };
  }

  for (const [section, rawNode] of Object.entries(rootProperties ?? {})) {
    const node = resolveNode(rawNode);
    if (!node.properties && !MULTI_INSTANCE_SECTIONS.has(section)) continue;

    const hints = loadSectionHints(section, level);
    const hidden = new Set(hints.hidden ?? []);

    if (!node.properties && MULTI_INSTANCE_SECTIONS.has(section)) {
      result[section] = expandMultiInstanceSection(level, section, node, hints);
      continue;
    }

    const fields = collectFields(level, section, node, hints);

    // Merge in composite fields (e.g. "detectors" belongs to the "model" page)
    for (const extraKey of COMPOSITE_FIELDS[section] ?? []) {
      const extraNode = resolveNode(rootProperties?.[extraKey] ?? {});
      const extraLocalized = translations[level]?.[extraKey] ?? {};
      fields[extraKey] = {
        label: extraLocalized.label ?? extraNode.title ?? extraKey,
        description:
          extraLocalized.description ?? extraNode.description ?? "",
        widget: "object",
        default: extraNode.default ?? null,
        enum: extraNode.enum ?? null,
        minimum: extraNode.minimum ?? extraNode.exclusiveMinimum ?? null,
        maximum: extraNode.maximum ?? extraNode.exclusiveMaximum ?? null,
        advanced: hints.advanced?.includes(extraKey) ?? false,
      };
    }

    for (const key of hidden) delete fields[key];

    const localized = translations[level]?.[section] ?? {};
    result[section] = {
      label: localized.label ?? rawNode.title ?? node.title ?? section,
      description: localized.description ?? rawNode.description ?? "",
      order: hints.order ?? [],
      groups: Object.entries(hints.groups ?? {}).map(([key, groupFields]) => ({
        key,
        label: groupLabel(level, section, key),
        fields: expandGroupFields(groupFields, fields),
      })),
      docs: hints.docs ?? null,
      fields,
    };
  }

  return result;
}

function parseSectionMapping(source, constantName, level) {
  const match = source.match(
    new RegExp(`const ${constantName}[^=]*=\\s*\\{([\\s\\S]*?)\\n\\};`),
  );
  if (!match) return [];
  return [...match[1].matchAll(/(\w+)\s*:\s*"([^"]+)"/g)].map(
    ([, section, page]) => ({ section, page, level }),
  );
}

function buildNavigation() {
  const source = fs.readFileSync(settingsSourcePath, "utf8");
  const settingsBlock = source.match(
    /const settingsGroups\s*=\s*\[([\s\S]*?)\n\];/,
  )?.[1];
  if (!settingsBlock) return { groups: [], pages: {} };

  const mappings = [
    ...parseSectionMapping(source, "GLOBAL_SECTION_MAPPING", "global"),
    ...parseSectionMapping(source, "CAMERA_SECTION_MAPPING", "camera"),
    ...parseSectionMapping(source, "ENRICHMENTS_SECTION_MAPPING", "global"),
    ...parseSectionMapping(source, "SYSTEM_SECTION_MAPPING", "global"),
  ];
  const pages = Object.fromEntries(
    mappings.map((mapping) => [mapping.page, mapping]),
  );
  const groupMatches = [...settingsBlock.matchAll(/\{\s*label:\s*"([^"]+)"/g)];
  const groups = groupMatches.map((match, index) => {
    const start = match.index ?? 0;
    const end = groupMatches[index + 1]?.index ?? settingsBlock.length;
    const sourceSlice = settingsBlock.slice(start, end);
    const itemKeys = [...sourceSlice.matchAll(/key:\s*"([^"]+)"/g)].map(
      (item) => item[1],
    );
    return {
      key: match[1],
      label: settingsTranslations.menu?.[match[1]] ?? match[1],
      items: itemKeys.map((key) => ({
        key,
        label: settingsTranslations.menu?.[key] ?? key,
        ...(key === "masksAndZones"
          ? { section: key, page: key, level: "camera" }
          : {}),
        ...(pages[key] ?? {}),
      })),
    };
  });

  return { groups, pages };
}

function buildDetectorTypes() {
  const detectorTranslations = translations.global?.detectors ?? {};
  const reserved = new Set([
    "label",
    "description",
    "type",
    "model",
    "model_path",
  ]);

  return Object.fromEntries(
    Object.entries(detectorTranslations)
      .filter(
        ([key, value]) =>
          !reserved.has(key) &&
          value &&
          typeof value === "object" &&
          typeof value.label === "string" &&
          typeof value.description === "string",
      )
      .map(([type, value]) => [
        type,
        {
          label: value.label,
          description: value.description,
          fields: Object.fromEntries(
            Object.entries(value)
              .filter(
                ([key, field]) =>
                  !["label", "description"].includes(key) &&
                  field &&
                  typeof field === "object" &&
                  typeof field.label === "string",
              )
              .map(([key, field]) => [
                key,
                {
                  label: field.label,
                  description: field.description ?? "",
                },
              ]),
          ),
        },
      ]),
  );
}

/**
 * Mirror of the backend endpoint GET /ffmpeg/presets
 * (frigate/api/app.py → ffmpeg_presets()). The real UI fetches the preset
 * lists from this API at runtime; bake the same lists into the manifest so
 * the mock's preset <select> options stay in sync with the backend.
 */
function extractFfmpegPresets() {
  const sourcePath = path.join(repoRoot, "frigate/api/app.py");
  if (!fs.existsSync(sourcePath)) return null;
  const source = fs.readFileSync(sourcePath, "utf8");
  const fnMatch = source.match(
    /def ffmpeg_presets\(\):[\s\S]*?hwaccel_presets\s*=\s*\[([\s\S]*?)\][\s\S]*?input_presets\s*=\s*\[([\s\S]*?)\][\s\S]*?record_output_presets\s*=\s*\[([\s\S]*?)\]/,
  );
  if (!fnMatch) return null;
  const parseList = (block) =>
    [...block.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  return {
    hwaccel_args: parseList(fnMatch[1]),
    input_args: parseList(fnMatch[2]),
    output_args: {
      record: parseList(fnMatch[3]),
      detect: [],
    },
  };
}

/**
 * Preset labels + widget copy read from the exact translation tables the
 * real widgets use (configForm.ffmpegArgs.* in views/settings.json).
 */
function extractFfmpegArgsMeta() {
  const block = settingsTranslations.configForm?.ffmpegArgs ?? {};
  const pick = (key) =>
    typeof block[key] === "string" && !Array.isArray(block[key])
      ? block[key]
      : undefined;
  const labels = {};
  for (const [key, value] of Object.entries(block.presetLabels ?? {})) {
    if (typeof value === "string") labels[key] = value;
  }
  return {
    presetLabels: labels,
    labels: {
      inherit: pick("inherit"),
      preset: pick("preset"),
      manual: pick("manual"),
      none: pick("none"),
      useGlobalSetting: pick("useGlobalSetting"),
      selectPreset: pick("selectPreset"),
      manualPlaceholder: pick("manualPlaceholder"),
    },
  };
}

const manifest = {
  generatedFrom: path.relative(docsRoot, schemaPath).replaceAll("\\", "/"),
  ffmpegPresets: extractFfmpegPresets(),
  ffmpegArgsMeta: extractFfmpegArgsMeta(),
  detectorTypes: buildDetectorTypes(),
  levels: {
    global: buildLevel("global"),
    camera: buildLevel("camera"),
  },
  navigation: buildNavigation(),
};

const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
if (process.argv.includes("--check")) {
  const current = fs.existsSync(outputPath)
    ? fs.readFileSync(outputPath, "utf8")
    : "";
  if (current !== serialized) {
    console.error(
      `${path.relative(docsRoot, outputPath)} is stale. Run npm run build:mock.`,
    );
    process.exit(1);
  }
  console.log(`Checked ${path.relative(docsRoot, outputPath)}`);
} else {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, serialized);
  console.log(`Generated ${path.relative(docsRoot, outputPath)}`);
}
