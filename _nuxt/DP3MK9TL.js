import { _ as _export_sfc, j as resolveDirective, c as createElementBlock, o as openBlock, k as withDirectives, i as createBaseVNode, l as withModifiers, N as withKeys, n as normalizeClass, O as Fragment, Q as renderList, t as toDisplayString, r as resolveComponent, b as createBlock, e as createCommentVNode, a as createVNode, L as createTextVNode, p as ref, v as computed, S as getDefaultExportFromCjs, F as defineComponent, u as watch, A as onMounted, U as unref, M as vModelText, V as mitt, m as normalizeStyle, W as Teleport, w as withCtx, X as vShow, Y as vModelSelect } from "#entry";
import { Z as ZodFirstPartyTypeKind, t as timeupdateSymbol, b as binarySearchClosestLTEIndex, a as binarySearchClosestGTEIndex, c as binarySearchClosestLessIndex, d as binarySearchClosestGreaterIndex, s as schemaSymbol, f as forkSymbol, l as labelSymbol, e as storageKeySymbol, h as applyDiskState, i as exportState, m as mergeDeep, r as reactiveProperties, j as removeOverrideFile, o as overridableFiles, k as overrideFile, n as hasDiskState } from "./BzWj2wsH.js";
import { d as drag$1 } from "./DoChJKP1.js";
const ignoreOverride = Symbol("Let zodToJsonSchema decide on which parser to use");
const defaultOptions = {
  name: void 0,
  $refStrategy: "root",
  basePath: ["#"],
  effectStrategy: "input",
  pipeStrategy: "all",
  dateStrategy: "format:date-time",
  mapStrategy: "entries",
  removeAdditionalStrategy: "passthrough",
  allowedAdditionalProperties: true,
  rejectedAdditionalProperties: false,
  definitionPath: "definitions",
  target: "jsonSchema7",
  strictUnions: false,
  definitions: {},
  errorMessages: false,
  markdownDescription: false,
  patternStrategy: "escape",
  applyRegexFlags: false,
  emailStrategy: "format:email",
  base64Strategy: "contentEncoding:base64",
  nameStrategy: "ref",
  openAiAnyTypeName: "OpenAiAnyType"
};
const getDefaultOptions = (options) => ({
  ...defaultOptions,
  ...options
});
const getRefs = (options) => {
  const _options = getDefaultOptions(options);
  const currentPath = _options.name !== void 0 ? [..._options.basePath, _options.definitionPath, _options.name] : _options.basePath;
  return {
    ..._options,
    flags: { hasReferencedOpenAiAnyType: false },
    currentPath,
    propertyPath: void 0,
    seen: new Map(Object.entries(_options.definitions).map(([name, def]) => [
      def._def,
      {
        def: def._def,
        path: [..._options.basePath, _options.definitionPath, name],
        // Resolution of references will be forced even though seen, so it's ok that the schema is undefined here for now.
        jsonSchema: void 0
      }
    ]))
  };
};
function addErrorMessage(res, key, errorMessage, refs) {
  if (!refs?.errorMessages)
    return;
  if (errorMessage) {
    res.errorMessage = {
      ...res.errorMessage,
      [key]: errorMessage
    };
  }
}
function setResponseValueAndErrors(res, key, value, errorMessage, refs) {
  res[key] = value;
  addErrorMessage(res, key, errorMessage, refs);
}
const getRelativePath = (pathA, pathB) => {
  let i = 0;
  for (; i < pathA.length && i < pathB.length; i++) {
    if (pathA[i] !== pathB[i])
      break;
  }
  return [(pathA.length - i).toString(), ...pathB.slice(i)].join("/");
};
function parseAnyDef(refs) {
  if (refs.target !== "openAi") {
    return {};
  }
  const anyDefinitionPath = [
    ...refs.basePath,
    refs.definitionPath,
    refs.openAiAnyTypeName
  ];
  refs.flags.hasReferencedOpenAiAnyType = true;
  return {
    $ref: refs.$refStrategy === "relative" ? getRelativePath(anyDefinitionPath, refs.currentPath) : anyDefinitionPath.join("/")
  };
}
function parseArrayDef(def, refs) {
  const res = {
    type: "array"
  };
  if (def.type?._def && def.type?._def?.typeName !== ZodFirstPartyTypeKind.ZodAny) {
    res.items = parseDef(def.type._def, {
      ...refs,
      currentPath: [...refs.currentPath, "items"]
    });
  }
  if (def.minLength) {
    setResponseValueAndErrors(res, "minItems", def.minLength.value, def.minLength.message, refs);
  }
  if (def.maxLength) {
    setResponseValueAndErrors(res, "maxItems", def.maxLength.value, def.maxLength.message, refs);
  }
  if (def.exactLength) {
    setResponseValueAndErrors(res, "minItems", def.exactLength.value, def.exactLength.message, refs);
    setResponseValueAndErrors(res, "maxItems", def.exactLength.value, def.exactLength.message, refs);
  }
  return res;
}
function parseBigintDef(def, refs) {
  const res = {
    type: "integer",
    format: "int64"
  };
  if (!def.checks)
    return res;
  for (const check of def.checks) {
    switch (check.kind) {
      case "min":
        if (refs.target === "jsonSchema7") {
          if (check.inclusive) {
            setResponseValueAndErrors(res, "minimum", check.value, check.message, refs);
          } else {
            setResponseValueAndErrors(res, "exclusiveMinimum", check.value, check.message, refs);
          }
        } else {
          if (!check.inclusive) {
            res.exclusiveMinimum = true;
          }
          setResponseValueAndErrors(res, "minimum", check.value, check.message, refs);
        }
        break;
      case "max":
        if (refs.target === "jsonSchema7") {
          if (check.inclusive) {
            setResponseValueAndErrors(res, "maximum", check.value, check.message, refs);
          } else {
            setResponseValueAndErrors(res, "exclusiveMaximum", check.value, check.message, refs);
          }
        } else {
          if (!check.inclusive) {
            res.exclusiveMaximum = true;
          }
          setResponseValueAndErrors(res, "maximum", check.value, check.message, refs);
        }
        break;
      case "multipleOf":
        setResponseValueAndErrors(res, "multipleOf", check.value, check.message, refs);
        break;
    }
  }
  return res;
}
function parseBooleanDef() {
  return {
    type: "boolean"
  };
}
function parseBrandedDef(_def, refs) {
  return parseDef(_def.type._def, refs);
}
const parseCatchDef = (def, refs) => {
  return parseDef(def.innerType._def, refs);
};
function parseDateDef(def, refs, overrideDateStrategy) {
  const strategy = overrideDateStrategy ?? refs.dateStrategy;
  if (Array.isArray(strategy)) {
    return {
      anyOf: strategy.map((item, i) => parseDateDef(def, refs, item))
    };
  }
  switch (strategy) {
    case "string":
    case "format:date-time":
      return {
        type: "string",
        format: "date-time"
      };
    case "format:date":
      return {
        type: "string",
        format: "date"
      };
    case "integer":
      return integerDateParser(def, refs);
  }
}
const integerDateParser = (def, refs) => {
  const res = {
    type: "integer",
    format: "unix-time"
  };
  if (refs.target === "openApi3") {
    return res;
  }
  for (const check of def.checks) {
    switch (check.kind) {
      case "min":
        setResponseValueAndErrors(
          res,
          "minimum",
          check.value,
          // This is in milliseconds
          check.message,
          refs
        );
        break;
      case "max":
        setResponseValueAndErrors(
          res,
          "maximum",
          check.value,
          // This is in milliseconds
          check.message,
          refs
        );
        break;
    }
  }
  return res;
};
function parseDefaultDef(_def, refs) {
  return {
    ...parseDef(_def.innerType._def, refs),
    default: _def.defaultValue()
  };
}
function parseEffectsDef(_def, refs) {
  return refs.effectStrategy === "input" ? parseDef(_def.schema._def, refs) : parseAnyDef(refs);
}
function parseEnumDef(def) {
  return {
    type: "string",
    enum: Array.from(def.values)
  };
}
const isJsonSchema7AllOfType = (type) => {
  if ("type" in type && type.type === "string")
    return false;
  return "allOf" in type;
};
function parseIntersectionDef(def, refs) {
  const allOf = [
    parseDef(def.left._def, {
      ...refs,
      currentPath: [...refs.currentPath, "allOf", "0"]
    }),
    parseDef(def.right._def, {
      ...refs,
      currentPath: [...refs.currentPath, "allOf", "1"]
    })
  ].filter((x) => !!x);
  let unevaluatedProperties = refs.target === "jsonSchema2019-09" ? { unevaluatedProperties: false } : void 0;
  const mergedAllOf = [];
  allOf.forEach((schema) => {
    if (isJsonSchema7AllOfType(schema)) {
      mergedAllOf.push(...schema.allOf);
      if (schema.unevaluatedProperties === void 0) {
        unevaluatedProperties = void 0;
      }
    } else {
      let nestedSchema = schema;
      if ("additionalProperties" in schema && schema.additionalProperties === false) {
        const { additionalProperties, ...rest } = schema;
        nestedSchema = rest;
      } else {
        unevaluatedProperties = void 0;
      }
      mergedAllOf.push(nestedSchema);
    }
  });
  return mergedAllOf.length ? {
    allOf: mergedAllOf,
    ...unevaluatedProperties
  } : void 0;
}
function parseLiteralDef(def, refs) {
  const parsedType = typeof def.value;
  if (parsedType !== "bigint" && parsedType !== "number" && parsedType !== "boolean" && parsedType !== "string") {
    return {
      type: Array.isArray(def.value) ? "array" : "object"
    };
  }
  if (refs.target === "openApi3") {
    return {
      type: parsedType === "bigint" ? "integer" : parsedType,
      enum: [def.value]
    };
  }
  return {
    type: parsedType === "bigint" ? "integer" : parsedType,
    const: def.value
  };
}
let emojiRegex = void 0;
const zodPatterns = {
  /**
   * `c` was changed to `[cC]` to replicate /i flag
   */
  cuid: /^[cC][^\s-]{8,}$/,
  cuid2: /^[0-9a-z]+$/,
  ulid: /^[0-9A-HJKMNP-TV-Z]{26}$/,
  /**
   * `a-z` was added to replicate /i flag
   */
  email: /^(?!\.)(?!.*\.\.)([a-zA-Z0-9_'+\-\.]*)[a-zA-Z0-9_+-]@([a-zA-Z0-9][a-zA-Z0-9\-]*\.)+[a-zA-Z]{2,}$/,
  /**
   * Constructed a valid Unicode RegExp
   *
   * Lazily instantiate since this type of regex isn't supported
   * in all envs (e.g. React Native).
   *
   * See:
   * https://github.com/colinhacks/zod/issues/2433
   * Fix in Zod:
   * https://github.com/colinhacks/zod/commit/9340fd51e48576a75adc919bff65dbc4a5d4c99b
   */
  emoji: () => {
    if (emojiRegex === void 0) {
      emojiRegex = RegExp("^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$", "u");
    }
    return emojiRegex;
  },
  /**
   * Unused
   */
  uuid: /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/,
  /**
   * Unused
   */
  ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/,
  ipv4Cidr: /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/,
  /**
   * Unused
   */
  ipv6: /^(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))$/,
  ipv6Cidr: /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,
  base64: /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/,
  base64url: /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/,
  nanoid: /^[a-zA-Z0-9_-]{21}$/,
  jwt: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/
};
function parseStringDef(def, refs) {
  const res = {
    type: "string"
  };
  if (def.checks) {
    for (const check of def.checks) {
      switch (check.kind) {
        case "min":
          setResponseValueAndErrors(res, "minLength", typeof res.minLength === "number" ? Math.max(res.minLength, check.value) : check.value, check.message, refs);
          break;
        case "max":
          setResponseValueAndErrors(res, "maxLength", typeof res.maxLength === "number" ? Math.min(res.maxLength, check.value) : check.value, check.message, refs);
          break;
        case "email":
          switch (refs.emailStrategy) {
            case "format:email":
              addFormat(res, "email", check.message, refs);
              break;
            case "format:idn-email":
              addFormat(res, "idn-email", check.message, refs);
              break;
            case "pattern:zod":
              addPattern(res, zodPatterns.email, check.message, refs);
              break;
          }
          break;
        case "url":
          addFormat(res, "uri", check.message, refs);
          break;
        case "uuid":
          addFormat(res, "uuid", check.message, refs);
          break;
        case "regex":
          addPattern(res, check.regex, check.message, refs);
          break;
        case "cuid":
          addPattern(res, zodPatterns.cuid, check.message, refs);
          break;
        case "cuid2":
          addPattern(res, zodPatterns.cuid2, check.message, refs);
          break;
        case "startsWith":
          addPattern(res, RegExp(`^${escapeLiteralCheckValue(check.value, refs)}`), check.message, refs);
          break;
        case "endsWith":
          addPattern(res, RegExp(`${escapeLiteralCheckValue(check.value, refs)}$`), check.message, refs);
          break;
        case "datetime":
          addFormat(res, "date-time", check.message, refs);
          break;
        case "date":
          addFormat(res, "date", check.message, refs);
          break;
        case "time":
          addFormat(res, "time", check.message, refs);
          break;
        case "duration":
          addFormat(res, "duration", check.message, refs);
          break;
        case "length":
          setResponseValueAndErrors(res, "minLength", typeof res.minLength === "number" ? Math.max(res.minLength, check.value) : check.value, check.message, refs);
          setResponseValueAndErrors(res, "maxLength", typeof res.maxLength === "number" ? Math.min(res.maxLength, check.value) : check.value, check.message, refs);
          break;
        case "includes": {
          addPattern(res, RegExp(escapeLiteralCheckValue(check.value, refs)), check.message, refs);
          break;
        }
        case "ip": {
          if (check.version !== "v6") {
            addFormat(res, "ipv4", check.message, refs);
          }
          if (check.version !== "v4") {
            addFormat(res, "ipv6", check.message, refs);
          }
          break;
        }
        case "base64url":
          addPattern(res, zodPatterns.base64url, check.message, refs);
          break;
        case "jwt":
          addPattern(res, zodPatterns.jwt, check.message, refs);
          break;
        case "cidr": {
          if (check.version !== "v6") {
            addPattern(res, zodPatterns.ipv4Cidr, check.message, refs);
          }
          if (check.version !== "v4") {
            addPattern(res, zodPatterns.ipv6Cidr, check.message, refs);
          }
          break;
        }
        case "emoji":
          addPattern(res, zodPatterns.emoji(), check.message, refs);
          break;
        case "ulid": {
          addPattern(res, zodPatterns.ulid, check.message, refs);
          break;
        }
        case "base64": {
          switch (refs.base64Strategy) {
            case "format:binary": {
              addFormat(res, "binary", check.message, refs);
              break;
            }
            case "contentEncoding:base64": {
              setResponseValueAndErrors(res, "contentEncoding", "base64", check.message, refs);
              break;
            }
            case "pattern:zod": {
              addPattern(res, zodPatterns.base64, check.message, refs);
              break;
            }
          }
          break;
        }
        case "nanoid": {
          addPattern(res, zodPatterns.nanoid, check.message, refs);
        }
      }
    }
  }
  return res;
}
function escapeLiteralCheckValue(literal, refs) {
  return refs.patternStrategy === "escape" ? escapeNonAlphaNumeric(literal) : literal;
}
const ALPHA_NUMERIC = new Set("ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvxyz0123456789");
function escapeNonAlphaNumeric(source) {
  let result = "";
  for (let i = 0; i < source.length; i++) {
    if (!ALPHA_NUMERIC.has(source[i])) {
      result += "\\";
    }
    result += source[i];
  }
  return result;
}
function addFormat(schema, value, message, refs) {
  if (schema.format || schema.anyOf?.some((x) => x.format)) {
    if (!schema.anyOf) {
      schema.anyOf = [];
    }
    if (schema.format) {
      schema.anyOf.push({
        format: schema.format,
        ...schema.errorMessage && refs.errorMessages && {
          errorMessage: { format: schema.errorMessage.format }
        }
      });
      delete schema.format;
      if (schema.errorMessage) {
        delete schema.errorMessage.format;
        if (Object.keys(schema.errorMessage).length === 0) {
          delete schema.errorMessage;
        }
      }
    }
    schema.anyOf.push({
      format: value,
      ...message && refs.errorMessages && { errorMessage: { format: message } }
    });
  } else {
    setResponseValueAndErrors(schema, "format", value, message, refs);
  }
}
function addPattern(schema, regex, message, refs) {
  if (schema.pattern || schema.allOf?.some((x) => x.pattern)) {
    if (!schema.allOf) {
      schema.allOf = [];
    }
    if (schema.pattern) {
      schema.allOf.push({
        pattern: schema.pattern,
        ...schema.errorMessage && refs.errorMessages && {
          errorMessage: { pattern: schema.errorMessage.pattern }
        }
      });
      delete schema.pattern;
      if (schema.errorMessage) {
        delete schema.errorMessage.pattern;
        if (Object.keys(schema.errorMessage).length === 0) {
          delete schema.errorMessage;
        }
      }
    }
    schema.allOf.push({
      pattern: stringifyRegExpWithFlags(regex, refs),
      ...message && refs.errorMessages && { errorMessage: { pattern: message } }
    });
  } else {
    setResponseValueAndErrors(schema, "pattern", stringifyRegExpWithFlags(regex, refs), message, refs);
  }
}
function stringifyRegExpWithFlags(regex, refs) {
  if (!refs.applyRegexFlags || !regex.flags) {
    return regex.source;
  }
  const flags = {
    i: regex.flags.includes("i"),
    m: regex.flags.includes("m"),
    s: regex.flags.includes("s")
    // `.` matches newlines
  };
  const source = flags.i ? regex.source.toLowerCase() : regex.source;
  let pattern = "";
  let isEscaped = false;
  let inCharGroup = false;
  let inCharRange = false;
  for (let i = 0; i < source.length; i++) {
    if (isEscaped) {
      pattern += source[i];
      isEscaped = false;
      continue;
    }
    if (flags.i) {
      if (inCharGroup) {
        if (source[i].match(/[a-z]/)) {
          if (inCharRange) {
            pattern += source[i];
            pattern += `${source[i - 2]}-${source[i]}`.toUpperCase();
            inCharRange = false;
          } else if (source[i + 1] === "-" && source[i + 2]?.match(/[a-z]/)) {
            pattern += source[i];
            inCharRange = true;
          } else {
            pattern += `${source[i]}${source[i].toUpperCase()}`;
          }
          continue;
        }
      } else if (source[i].match(/[a-z]/)) {
        pattern += `[${source[i]}${source[i].toUpperCase()}]`;
        continue;
      }
    }
    if (flags.m) {
      if (source[i] === "^") {
        pattern += `(^|(?<=[\r
]))`;
        continue;
      } else if (source[i] === "$") {
        pattern += `($|(?=[\r
]))`;
        continue;
      }
    }
    if (flags.s && source[i] === ".") {
      pattern += inCharGroup ? `${source[i]}\r
` : `[${source[i]}\r
]`;
      continue;
    }
    pattern += source[i];
    if (source[i] === "\\") {
      isEscaped = true;
    } else if (inCharGroup && source[i] === "]") {
      inCharGroup = false;
    } else if (!inCharGroup && source[i] === "[") {
      inCharGroup = true;
    }
  }
  try {
    new RegExp(pattern);
  } catch {
    return regex.source;
  }
  return pattern;
}
function parseRecordDef(def, refs) {
  if (refs.target === "openAi") {
  }
  if (refs.target === "openApi3" && def.keyType?._def.typeName === ZodFirstPartyTypeKind.ZodEnum) {
    return {
      type: "object",
      required: def.keyType._def.values,
      properties: def.keyType._def.values.reduce((acc, key) => ({
        ...acc,
        [key]: parseDef(def.valueType._def, {
          ...refs,
          currentPath: [...refs.currentPath, "properties", key]
        }) ?? parseAnyDef(refs)
      }), {}),
      additionalProperties: refs.rejectedAdditionalProperties
    };
  }
  const schema = {
    type: "object",
    additionalProperties: parseDef(def.valueType._def, {
      ...refs,
      currentPath: [...refs.currentPath, "additionalProperties"]
    }) ?? refs.allowedAdditionalProperties
  };
  if (refs.target === "openApi3") {
    return schema;
  }
  if (def.keyType?._def.typeName === ZodFirstPartyTypeKind.ZodString && def.keyType._def.checks?.length) {
    const { type, ...keyType } = parseStringDef(def.keyType._def, refs);
    return {
      ...schema,
      propertyNames: keyType
    };
  } else if (def.keyType?._def.typeName === ZodFirstPartyTypeKind.ZodEnum) {
    return {
      ...schema,
      propertyNames: {
        enum: def.keyType._def.values
      }
    };
  } else if (def.keyType?._def.typeName === ZodFirstPartyTypeKind.ZodBranded && def.keyType._def.type._def.typeName === ZodFirstPartyTypeKind.ZodString && def.keyType._def.type._def.checks?.length) {
    const { type, ...keyType } = parseBrandedDef(def.keyType._def, refs);
    return {
      ...schema,
      propertyNames: keyType
    };
  }
  return schema;
}
function parseMapDef(def, refs) {
  if (refs.mapStrategy === "record") {
    return parseRecordDef(def, refs);
  }
  const keys = parseDef(def.keyType._def, {
    ...refs,
    currentPath: [...refs.currentPath, "items", "items", "0"]
  }) || parseAnyDef(refs);
  const values = parseDef(def.valueType._def, {
    ...refs,
    currentPath: [...refs.currentPath, "items", "items", "1"]
  }) || parseAnyDef(refs);
  return {
    type: "array",
    maxItems: 125,
    items: {
      type: "array",
      items: [keys, values],
      minItems: 2,
      maxItems: 2
    }
  };
}
function parseNativeEnumDef(def) {
  const object = def.values;
  const actualKeys = Object.keys(def.values).filter((key) => {
    return typeof object[object[key]] !== "number";
  });
  const actualValues = actualKeys.map((key) => object[key]);
  const parsedTypes = Array.from(new Set(actualValues.map((values) => typeof values)));
  return {
    type: parsedTypes.length === 1 ? parsedTypes[0] === "string" ? "string" : "number" : ["string", "number"],
    enum: actualValues
  };
}
function parseNeverDef(refs) {
  return refs.target === "openAi" ? void 0 : {
    not: parseAnyDef({
      ...refs,
      currentPath: [...refs.currentPath, "not"]
    })
  };
}
function parseNullDef(refs) {
  return refs.target === "openApi3" ? {
    enum: ["null"],
    nullable: true
  } : {
    type: "null"
  };
}
const primitiveMappings = {
  ZodString: "string",
  ZodNumber: "number",
  ZodBigInt: "integer",
  ZodBoolean: "boolean",
  ZodNull: "null"
};
function parseUnionDef(def, refs) {
  if (refs.target === "openApi3")
    return asAnyOf(def, refs);
  const options = def.options instanceof Map ? Array.from(def.options.values()) : def.options;
  if (options.every((x) => x._def.typeName in primitiveMappings && (!x._def.checks || !x._def.checks.length))) {
    const types = options.reduce((types2, x) => {
      const type = primitiveMappings[x._def.typeName];
      return type && !types2.includes(type) ? [...types2, type] : types2;
    }, []);
    return {
      type: types.length > 1 ? types : types[0]
    };
  } else if (options.every((x) => x._def.typeName === "ZodLiteral" && !x.description)) {
    const types = options.reduce((acc, x) => {
      const type = typeof x._def.value;
      switch (type) {
        case "string":
        case "number":
        case "boolean":
          return [...acc, type];
        case "bigint":
          return [...acc, "integer"];
        case "object":
          if (x._def.value === null)
            return [...acc, "null"];
        case "symbol":
        case "undefined":
        case "function":
        default:
          return acc;
      }
    }, []);
    if (types.length === options.length) {
      const uniqueTypes = types.filter((x, i, a) => a.indexOf(x) === i);
      return {
        type: uniqueTypes.length > 1 ? uniqueTypes : uniqueTypes[0],
        enum: options.reduce((acc, x) => {
          return acc.includes(x._def.value) ? acc : [...acc, x._def.value];
        }, [])
      };
    }
  } else if (options.every((x) => x._def.typeName === "ZodEnum")) {
    return {
      type: "string",
      enum: options.reduce((acc, x) => [
        ...acc,
        ...x._def.values.filter((x2) => !acc.includes(x2))
      ], [])
    };
  }
  return asAnyOf(def, refs);
}
const asAnyOf = (def, refs) => {
  const anyOf = (def.options instanceof Map ? Array.from(def.options.values()) : def.options).map((x, i) => parseDef(x._def, {
    ...refs,
    currentPath: [...refs.currentPath, "anyOf", `${i}`]
  })).filter((x) => !!x && (!refs.strictUnions || typeof x === "object" && Object.keys(x).length > 0));
  return anyOf.length ? { anyOf } : void 0;
};
function parseNullableDef(def, refs) {
  if (["ZodString", "ZodNumber", "ZodBigInt", "ZodBoolean", "ZodNull"].includes(def.innerType._def.typeName) && (!def.innerType._def.checks || !def.innerType._def.checks.length)) {
    if (refs.target === "openApi3") {
      return {
        type: primitiveMappings[def.innerType._def.typeName],
        nullable: true
      };
    }
    return {
      type: [
        primitiveMappings[def.innerType._def.typeName],
        "null"
      ]
    };
  }
  if (refs.target === "openApi3") {
    const base2 = parseDef(def.innerType._def, {
      ...refs,
      currentPath: [...refs.currentPath]
    });
    if (base2 && "$ref" in base2)
      return { allOf: [base2], nullable: true };
    return base2 && { ...base2, nullable: true };
  }
  const base = parseDef(def.innerType._def, {
    ...refs,
    currentPath: [...refs.currentPath, "anyOf", "0"]
  });
  return base && { anyOf: [base, { type: "null" }] };
}
function parseNumberDef(def, refs) {
  const res = {
    type: "number"
  };
  if (!def.checks)
    return res;
  for (const check of def.checks) {
    switch (check.kind) {
      case "int":
        res.type = "integer";
        addErrorMessage(res, "type", check.message, refs);
        break;
      case "min":
        if (refs.target === "jsonSchema7") {
          if (check.inclusive) {
            setResponseValueAndErrors(res, "minimum", check.value, check.message, refs);
          } else {
            setResponseValueAndErrors(res, "exclusiveMinimum", check.value, check.message, refs);
          }
        } else {
          if (!check.inclusive) {
            res.exclusiveMinimum = true;
          }
          setResponseValueAndErrors(res, "minimum", check.value, check.message, refs);
        }
        break;
      case "max":
        if (refs.target === "jsonSchema7") {
          if (check.inclusive) {
            setResponseValueAndErrors(res, "maximum", check.value, check.message, refs);
          } else {
            setResponseValueAndErrors(res, "exclusiveMaximum", check.value, check.message, refs);
          }
        } else {
          if (!check.inclusive) {
            res.exclusiveMaximum = true;
          }
          setResponseValueAndErrors(res, "maximum", check.value, check.message, refs);
        }
        break;
      case "multipleOf":
        setResponseValueAndErrors(res, "multipleOf", check.value, check.message, refs);
        break;
    }
  }
  return res;
}
function parseObjectDef(def, refs) {
  const forceOptionalIntoNullable = refs.target === "openAi";
  const result = {
    type: "object",
    properties: {}
  };
  const required = [];
  const shape = def.shape();
  for (const propName in shape) {
    let propDef = shape[propName];
    if (propDef === void 0 || propDef._def === void 0) {
      continue;
    }
    let propOptional = safeIsOptional(propDef);
    if (propOptional && forceOptionalIntoNullable) {
      if (propDef._def.typeName === "ZodOptional") {
        propDef = propDef._def.innerType;
      }
      if (!propDef.isNullable()) {
        propDef = propDef.nullable();
      }
      propOptional = false;
    }
    const parsedDef = parseDef(propDef._def, {
      ...refs,
      currentPath: [...refs.currentPath, "properties", propName],
      propertyPath: [...refs.currentPath, "properties", propName]
    });
    if (parsedDef === void 0) {
      continue;
    }
    result.properties[propName] = parsedDef;
    if (!propOptional) {
      required.push(propName);
    }
  }
  if (required.length) {
    result.required = required;
  }
  const additionalProperties = decideAdditionalProperties(def, refs);
  if (additionalProperties !== void 0) {
    result.additionalProperties = additionalProperties;
  }
  return result;
}
function decideAdditionalProperties(def, refs) {
  if (def.catchall._def.typeName !== "ZodNever") {
    return parseDef(def.catchall._def, {
      ...refs,
      currentPath: [...refs.currentPath, "additionalProperties"]
    });
  }
  switch (def.unknownKeys) {
    case "passthrough":
      return refs.allowedAdditionalProperties;
    case "strict":
      return refs.rejectedAdditionalProperties;
    case "strip":
      return refs.removeAdditionalStrategy === "strict" ? refs.allowedAdditionalProperties : refs.rejectedAdditionalProperties;
  }
}
function safeIsOptional(schema) {
  try {
    return schema.isOptional();
  } catch {
    return true;
  }
}
const parseOptionalDef = (def, refs) => {
  if (refs.currentPath.toString() === refs.propertyPath?.toString()) {
    return parseDef(def.innerType._def, refs);
  }
  const innerSchema = parseDef(def.innerType._def, {
    ...refs,
    currentPath: [...refs.currentPath, "anyOf", "1"]
  });
  return innerSchema ? {
    anyOf: [
      {
        not: parseAnyDef(refs)
      },
      innerSchema
    ]
  } : parseAnyDef(refs);
};
const parsePipelineDef = (def, refs) => {
  if (refs.pipeStrategy === "input") {
    return parseDef(def.in._def, refs);
  } else if (refs.pipeStrategy === "output") {
    return parseDef(def.out._def, refs);
  }
  const a = parseDef(def.in._def, {
    ...refs,
    currentPath: [...refs.currentPath, "allOf", "0"]
  });
  const b = parseDef(def.out._def, {
    ...refs,
    currentPath: [...refs.currentPath, "allOf", a ? "1" : "0"]
  });
  return {
    allOf: [a, b].filter((x) => x !== void 0)
  };
};
function parsePromiseDef(def, refs) {
  return parseDef(def.type._def, refs);
}
function parseSetDef(def, refs) {
  const items = parseDef(def.valueType._def, {
    ...refs,
    currentPath: [...refs.currentPath, "items"]
  });
  const schema = {
    type: "array",
    uniqueItems: true,
    items
  };
  if (def.minSize) {
    setResponseValueAndErrors(schema, "minItems", def.minSize.value, def.minSize.message, refs);
  }
  if (def.maxSize) {
    setResponseValueAndErrors(schema, "maxItems", def.maxSize.value, def.maxSize.message, refs);
  }
  return schema;
}
function parseTupleDef(def, refs) {
  if (def.rest) {
    return {
      type: "array",
      minItems: def.items.length,
      items: def.items.map((x, i) => parseDef(x._def, {
        ...refs,
        currentPath: [...refs.currentPath, "items", `${i}`]
      })).reduce((acc, x) => x === void 0 ? acc : [...acc, x], []),
      additionalItems: parseDef(def.rest._def, {
        ...refs,
        currentPath: [...refs.currentPath, "additionalItems"]
      })
    };
  } else {
    return {
      type: "array",
      minItems: def.items.length,
      maxItems: def.items.length,
      items: def.items.map((x, i) => parseDef(x._def, {
        ...refs,
        currentPath: [...refs.currentPath, "items", `${i}`]
      })).reduce((acc, x) => x === void 0 ? acc : [...acc, x], [])
    };
  }
}
function parseUndefinedDef(refs) {
  return {
    not: parseAnyDef(refs)
  };
}
function parseUnknownDef(refs) {
  return parseAnyDef(refs);
}
const parseReadonlyDef = (def, refs) => {
  return parseDef(def.innerType._def, refs);
};
const selectParser = (def, typeName, refs) => {
  switch (typeName) {
    case ZodFirstPartyTypeKind.ZodString:
      return parseStringDef(def, refs);
    case ZodFirstPartyTypeKind.ZodNumber:
      return parseNumberDef(def, refs);
    case ZodFirstPartyTypeKind.ZodObject:
      return parseObjectDef(def, refs);
    case ZodFirstPartyTypeKind.ZodBigInt:
      return parseBigintDef(def, refs);
    case ZodFirstPartyTypeKind.ZodBoolean:
      return parseBooleanDef();
    case ZodFirstPartyTypeKind.ZodDate:
      return parseDateDef(def, refs);
    case ZodFirstPartyTypeKind.ZodUndefined:
      return parseUndefinedDef(refs);
    case ZodFirstPartyTypeKind.ZodNull:
      return parseNullDef(refs);
    case ZodFirstPartyTypeKind.ZodArray:
      return parseArrayDef(def, refs);
    case ZodFirstPartyTypeKind.ZodUnion:
    case ZodFirstPartyTypeKind.ZodDiscriminatedUnion:
      return parseUnionDef(def, refs);
    case ZodFirstPartyTypeKind.ZodIntersection:
      return parseIntersectionDef(def, refs);
    case ZodFirstPartyTypeKind.ZodTuple:
      return parseTupleDef(def, refs);
    case ZodFirstPartyTypeKind.ZodRecord:
      return parseRecordDef(def, refs);
    case ZodFirstPartyTypeKind.ZodLiteral:
      return parseLiteralDef(def, refs);
    case ZodFirstPartyTypeKind.ZodEnum:
      return parseEnumDef(def);
    case ZodFirstPartyTypeKind.ZodNativeEnum:
      return parseNativeEnumDef(def);
    case ZodFirstPartyTypeKind.ZodNullable:
      return parseNullableDef(def, refs);
    case ZodFirstPartyTypeKind.ZodOptional:
      return parseOptionalDef(def, refs);
    case ZodFirstPartyTypeKind.ZodMap:
      return parseMapDef(def, refs);
    case ZodFirstPartyTypeKind.ZodSet:
      return parseSetDef(def, refs);
    case ZodFirstPartyTypeKind.ZodLazy:
      return () => def.getter()._def;
    case ZodFirstPartyTypeKind.ZodPromise:
      return parsePromiseDef(def, refs);
    case ZodFirstPartyTypeKind.ZodNaN:
    case ZodFirstPartyTypeKind.ZodNever:
      return parseNeverDef(refs);
    case ZodFirstPartyTypeKind.ZodEffects:
      return parseEffectsDef(def, refs);
    case ZodFirstPartyTypeKind.ZodAny:
      return parseAnyDef(refs);
    case ZodFirstPartyTypeKind.ZodUnknown:
      return parseUnknownDef(refs);
    case ZodFirstPartyTypeKind.ZodDefault:
      return parseDefaultDef(def, refs);
    case ZodFirstPartyTypeKind.ZodBranded:
      return parseBrandedDef(def, refs);
    case ZodFirstPartyTypeKind.ZodReadonly:
      return parseReadonlyDef(def, refs);
    case ZodFirstPartyTypeKind.ZodCatch:
      return parseCatchDef(def, refs);
    case ZodFirstPartyTypeKind.ZodPipeline:
      return parsePipelineDef(def, refs);
    case ZodFirstPartyTypeKind.ZodFunction:
    case ZodFirstPartyTypeKind.ZodVoid:
    case ZodFirstPartyTypeKind.ZodSymbol:
      return void 0;
    default:
      return /* @__PURE__ */ ((_) => void 0)();
  }
};
function parseDef(def, refs, forceResolution = false) {
  const seenItem = refs.seen.get(def);
  if (refs.override) {
    const overrideResult = refs.override?.(def, refs, seenItem, forceResolution);
    if (overrideResult !== ignoreOverride) {
      return overrideResult;
    }
  }
  if (seenItem && !forceResolution) {
    const seenSchema = get$ref(seenItem, refs);
    if (seenSchema !== void 0) {
      return seenSchema;
    }
  }
  const newItem = { def, path: refs.currentPath, jsonSchema: void 0 };
  refs.seen.set(def, newItem);
  const jsonSchemaOrGetter = selectParser(def, def.typeName, refs);
  const jsonSchema = typeof jsonSchemaOrGetter === "function" ? parseDef(jsonSchemaOrGetter(), refs) : jsonSchemaOrGetter;
  if (jsonSchema) {
    addMeta(def, refs, jsonSchema);
  }
  if (refs.postProcess) {
    const postProcessResult = refs.postProcess(jsonSchema, def, refs);
    newItem.jsonSchema = jsonSchema;
    return postProcessResult;
  }
  newItem.jsonSchema = jsonSchema;
  return jsonSchema;
}
const get$ref = (item, refs) => {
  switch (refs.$refStrategy) {
    case "root":
      return { $ref: item.path.join("/") };
    case "relative":
      return { $ref: getRelativePath(refs.currentPath, item.path) };
    case "none":
    case "seen": {
      if (item.path.length < refs.currentPath.length && item.path.every((value, index) => refs.currentPath[index] === value)) {
        return parseAnyDef(refs);
      }
      return refs.$refStrategy === "seen" ? parseAnyDef(refs) : void 0;
    }
  }
};
const addMeta = (def, refs, jsonSchema) => {
  if (def.description) {
    jsonSchema.description = def.description;
    if (refs.markdownDescription) {
      jsonSchema.markdownDescription = def.description;
    }
  }
  return jsonSchema;
};
const zodToJsonSchema = (schema, options) => {
  const refs = getRefs(options);
  let definitions = typeof options === "object" && options.definitions ? Object.entries(options.definitions).reduce((acc, [name2, schema2]) => ({
    ...acc,
    [name2]: parseDef(schema2._def, {
      ...refs,
      currentPath: [...refs.basePath, refs.definitionPath, name2]
    }, true) ?? parseAnyDef(refs)
  }), {}) : void 0;
  const name = typeof options === "string" ? options : options?.name;
  const main = parseDef(
    schema._def,
    refs,
    false
  ) ?? parseAnyDef(refs);
  if (refs.flags.hasReferencedOpenAiAnyType) {
    if (!definitions) {
      definitions = {};
    }
    if (!definitions[refs.openAiAnyTypeName]) {
      definitions[refs.openAiAnyTypeName] = {
        // Skipping "object" as no properties can be defined and additionalProperties must be "false"
        type: ["string", "number", "integer", "boolean", "array", "null"],
        items: {
          $ref: refs.$refStrategy === "relative" ? "1" : [
            ...refs.basePath,
            refs.definitionPath,
            refs.openAiAnyTypeName
          ].join("/")
        }
      };
    }
  }
  const combined = name === void 0 ? definitions ? {
    ...main,
    [refs.definitionPath]: definitions
  } : main : {
    $ref: [
      ...refs.$refStrategy === "relative" ? [] : refs.basePath,
      refs.definitionPath,
      name
    ].join("/"),
    [refs.definitionPath]: {
      ...definitions,
      [name]: main
    }
  };
  if (refs.target === "jsonSchema7") {
    combined.$schema = "http://json-schema.org/draft-07/schema#";
  } else if (refs.target === "jsonSchema2019-09" || refs.target === "openAi") {
    combined.$schema = "https://json-schema.org/draft/2019-09/schema#";
  }
  if (refs.target === "openAi" && ("anyOf" in combined || "oneOf" in combined || "allOf" in combined || "type" in combined && Array.isArray(combined.type))) {
  }
  return combined;
};
const _sfc_main$i = {
  name: "SchemaInput",
  directives: {
    drag: drag$1
  },
  props: {
    disabled: {
      type: Boolean,
      default: false
    },
    placeholder: {},
    schema: {
      required: true
    },
    type: {
      required: true
    },
    modelValue: {
      required: true
    },
    zod: {
      required: true
    }
  },
  computed: {
    computedType() {
      switch (this.type) {
        case "string":
          return "text";
        case "number":
          return "tel";
        default:
          return this.type;
      }
    },
    step() {
      if (this.shiftPressed) {
        return 0.01;
      } else {
        return 1;
      }
    }
  },
  data() {
    return {
      shiftPressed: false,
      dragging: false,
      value: this.modelValue,
      errors: []
    };
  },
  watch: {
    modelValue: {
      handler: function() {
        this.value = this.modelValue;
      },
      immediate: true
    }
  },
  mounted() {
    window.addEventListener("keydown", this.keydown, { capture: true });
    window.addEventListener("keyup", this.keyup, { capture: true });
  },
  beforeUnmount() {
    window.removeEventListener("keydown", this.keydown);
    window.removeEventListener("keyup", this.keyup);
  },
  methods: {
    handleDragStart() {
      this.dragging = true;
      document.body.classList.add("rw-studio-dragging");
    },
    handleDragEnd() {
      this.dragging = false;
      document.body.classList.remove("rw-studio-dragging");
    },
    handleDrag(e) {
      this.$refs.input.focus();
      this.validateAndInput({
        target: {
          value: parseFloat((this.value + e.detail.deltaX * this.step).toFixed(5))
        }
      });
    },
    keydown(event2) {
      if (event2.shiftKey) {
        this.shiftPressed = true;
      }
    },
    keyup(event2) {
      this.shiftPressed = false;
    },
    validateAndInput($event) {
      this.value = $event.target.value;
      switch (this.type) {
        case "number":
          this.value = String(this.value).replaceAll(",", ".");
          if (this.value == "0-") {
            this.value = "-";
          }
          if (this.value == ".") {
            this.value = "0.";
          }
          if (this.value == "" || this.value == "-" || this.value == "-0" || this.value == "0-" || [
            "0.0",
            "0.00",
            "0.000",
            "0.0000",
            "0.00000",
            "0.000000",
            "0.0000000",
            "0.00000000",
            "0.000000000"
          ].includes(this.value.replace("-", ""))) {
            if (this.value == "-" || this.value == "-0") ;
            else {
              this.value = (this.value.match(/-?\d+(?:\.\d+)?/g) || []).join(" ");
            }
            this.errors = ["Value is not valid"];
            return;
          }
          let proxyValue = String(this.value);
          if (proxyValue.endsWith(".")) {
            if (proxyValue.split(".").length > 2) {
              this.value = proxyValue.split(".").slice(0, 2).join(".");
            }
            proxyValue.replace(".", "");
            return;
          }
          proxyValue = parseFloat(proxyValue);
          if (isNaN(proxyValue)) {
            this.value = 0;
          } else {
            this.value = proxyValue;
          }
          break;
      }
      try {
        this.zod.parse(this.value);
        this.$emit("update:modelValue", this.value);
        this.errors = [];
      } catch (error) {
        this.errors = error.issues.map((v) => v.message);
      }
    }
  }
};
const _hoisted_1$d = { class: "dverso_form_control" };
const _hoisted_2$a = ["value", "step", "disabled", "type", "placeholder"];
const _hoisted_3$6 = { class: "error" };
function _sfc_render$h(_ctx, _cache, $props, $setup, $data, $options) {
  const _directive_drag = resolveDirective("drag");
  return openBlock(), createElementBlock("div", _hoisted_1$d, [
    withDirectives(createBaseVNode("input", {
      ref: "input",
      onDragging: _cache[0] || (_cache[0] = (...args) => $options.handleDrag && $options.handleDrag(...args)),
      onDraggingstart: _cache[1] || (_cache[1] = (...args) => $options.handleDragStart && $options.handleDragStart(...args)),
      onDraggingend: _cache[2] || (_cache[2] = (...args) => $options.handleDragEnd && $options.handleDragEnd(...args)),
      class: normalizeClass(["small", {
        has_error: $data.errors.length,
        shift: $data.shiftPressed,
        shift_forced: $data.shiftPressed && $data.dragging
      }]),
      value: $data.value,
      onInput: _cache[3] || (_cache[3] = (...args) => $options.validateAndInput && $options.validateAndInput(...args)),
      onKeydown: [
        _cache[4] || (_cache[4] = withModifiers(() => {
        }, ["stop"])),
        _cache[6] || (_cache[6] = withKeys(($event) => $options.validateAndInput(
          {
            target: {
              value: parseFloat(($data.value + 1 * $options.step).toFixed(5))
            }
          }
        ), ["right"])),
        _cache[7] || (_cache[7] = withKeys(($event) => $options.validateAndInput(
          {
            target: {
              value: parseFloat(($data.value + -1 * $options.step).toFixed(5))
            }
          }
        ), ["left"]))
      ],
      onKeyup: _cache[5] || (_cache[5] = withModifiers(() => {
      }, ["stop"])),
      step: $options.step,
      disabled: $props.disabled,
      type: $options.computedType,
      pattern: "-?[0-9]+(\\.[0-9]+)*",
      placeholder: $props.placeholder
    }, null, 42, _hoisted_2$a), [
      [_directive_drag]
    ]),
    (openBlock(true), createElementBlock(Fragment, null, renderList($data.errors, (error) => {
      return openBlock(), createElementBlock("p", _hoisted_3$6, toDisplayString(error), 1);
    }), 256))
  ]);
}
const SchemaInput = /* @__PURE__ */ _export_sfc(_sfc_main$i, [["render", _sfc_render$h], ["__scopeId", "data-v-9676e2ad"]]);
function fps(value, timeline) {
  return value - value % (1 / timeline.___fps);
}
const _sfc_main$h = {
  props: ["timeline", "tkey", "parent", "modelValue"],
  computed: {
    orderedTimesTuple() {
      return this.trackData.times.map((t, i) => [t, i]).slice().sort((a, b) => a[0] - b[0]);
    },
    nextIndex() {
      let i = binarySearchClosestGreaterIndex(this.timeline.___time, this.orderedTimesTuple);
      return this.orderedTimesTuple?.[i]?.[1];
    },
    prevIndex() {
      let i = binarySearchClosestLessIndex(this.timeline.___time, this.orderedTimesTuple);
      return this.orderedTimesTuple?.[i]?.[1];
    },
    nextGTEIndex() {
      let i = binarySearchClosestGTEIndex(this.timeline.___time, this.orderedTimesTuple);
      return this.orderedTimesTuple?.[i]?.[1];
    },
    prevLTEIndex() {
      let i = binarySearchClosestLTEIndex(this.timeline.___time, this.orderedTimesTuple);
      return this.orderedTimesTuple?.[i]?.[1];
    },
    hasNext() {
      if (this.trackData.times.length == 0) {
        return false;
      }
      return this.nextIndex != void 0;
    },
    hasPrev() {
      if (this.trackData.times.length == 0) {
        return false;
      }
      return this.prevIndex != void 0;
    },
    hasTick() {
      if (this.nextGTEIndex != void 0) {
        let fpsTime = fps(this.timeline.___time, this.timeline);
        let fpsIndex = fps(this.trackData.times[this.nextGTEIndex], this.timeline);
        return fpsTime == fpsIndex;
      }
      return false;
    },
    trackData() {
      return this.parent["___timeline_" + this.tkey];
    }
  },
  watch: {
    nextGTEIndex() {
      return this.$emit("update:modelValue", {
        hasTick: this.hasTick,
        tickIndex: this.nextGTEIndex
      });
    },
    hasTick() {
      return this.$emit("update:modelValue", {
        hasTick: this.hasTick,
        tickIndex: this.nextGTEIndex
      });
    }
  },
  mounted() {
    this.$emit("update:modelValue", {
      hasTick: this.hasTick,
      tickIndex: this.nextGTEIndex
    });
  },
  methods: {
    scrollNext() {
      if (this.hasNext) {
        this.timeline.___time = this.trackData.times[this.nextIndex];
        this.timeline[timeupdateSymbol]?.(this.timeline.___time);
      }
    },
    scrollPrev() {
      if (this.hasPrev) {
        this.timeline.___time = this.trackData.times[this.prevIndex];
        this.timeline[timeupdateSymbol]?.(this.timeline.___time);
      }
    },
    dropPoint() {
      if (this.hasTick) {
        let tickIndex = this.nextGTEIndex;
        this.trackData.values.splice(tickIndex, 1);
        this.trackData.times.splice(tickIndex, 1);
        this.trackData.bezier.splice(tickIndex, 1);
        return;
      }
      event.offsetX;
      let time = this.timeline.___time;
      let value = this.parent[this.tkey];
      this.trackData.values.push(value.value ? value.value : value);
      this.trackData.times.push(time);
      this.trackData.bezier.push([0, 0, 1, 1]);
    }
  }
};
const _hoisted_1$c = { class: "property_tick_controls" };
function _sfc_render$g(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("div", _hoisted_1$c, [
    createBaseVNode("div", {
      class: normalizeClass([{
        available: $options.hasPrev
      }, "prev"]),
      onClick: _cache[0] || (_cache[0] = (...args) => $options.scrollPrev && $options.scrollPrev(...args))
    }, null, 2),
    createBaseVNode("div", {
      class: normalizeClass([{
        available: !$options.hasTick
      }, "tick"]),
      onClick: _cache[1] || (_cache[1] = (...args) => $options.dropPoint && $options.dropPoint(...args))
    }, null, 2),
    createBaseVNode("div", {
      class: normalizeClass([{
        available: $options.hasNext
      }, "next"]),
      onClick: _cache[2] || (_cache[2] = (...args) => $options.scrollNext && $options.scrollNext(...args))
    }, null, 2)
  ]);
}
const PropertyTickControls = /* @__PURE__ */ _export_sfc(_sfc_main$h, [["render", _sfc_render$g], ["__scopeId", "data-v-e1fbdc1c"]]);
const _sfc_main$g = {
  components: {
    SchemaInput,
    PropertyTickControls
  },
  props: {
    schema: {
      required: true
    },
    allowtimeline: {},
    root: {},
    tkey: {},
    disabled: {
      type: Boolean,
      default: false
    },
    placeholder: {},
    type: {
      required: true
    },
    zod: {
      required: true
    },
    getRef: {}
  },
  data() {
    return {
      tickInfo: {
        hasTick: false,
        tickIndex: void 0
      },
      formRef: this.getRef()
    };
  }
};
function _sfc_render$f(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_SchemaInput = resolveComponent("SchemaInput");
  const _component_PropertyTickControls = resolveComponent("PropertyTickControls");
  return openBlock(), createElementBlock(Fragment, null, [
    $props.root.___timeline && $data.tickInfo.hasTick && $props.allowtimeline ? (openBlock(), createBlock(_component_SchemaInput, {
      key: 0,
      disabled: $props.disabled,
      modelValue: $data.formRef["___timeline_" + $props.tkey].values[$data.tickInfo.tickIndex],
      "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $data.formRef["___timeline_" + $props.tkey].values[$data.tickInfo.tickIndex] = $event),
      type: $props.type,
      schema: $props.schema,
      zod: $props.zod,
      placeholder: $props.placeholder
    }, null, 8, ["disabled", "modelValue", "type", "schema", "zod", "placeholder"])) : (openBlock(), createBlock(_component_SchemaInput, {
      key: 1,
      disabled: $props.disabled || $props.root.___timeline && !$data.tickInfo.hasTick,
      modelValue: $data.formRef[$props.tkey],
      "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $data.formRef[$props.tkey] = $event),
      type: $props.type,
      zod: $props.zod,
      schema: $props.schema,
      placeholder: $props.placeholder
    }, null, 8, ["disabled", "modelValue", "type", "zod", "schema", "placeholder"])),
    $props.root.___timeline && $props.allowtimeline ? (openBlock(), createBlock(_component_PropertyTickControls, {
      key: 2,
      modelValue: $data.tickInfo,
      "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $data.tickInfo = $event),
      timeline: $props.root,
      tkey: $props.tkey,
      parent: $data.formRef
    }, null, 8, ["modelValue", "timeline", "tkey", "parent"])) : createCommentVNode("", true)
  ], 64);
}
const SchemaTimelineProxyInput = /* @__PURE__ */ _export_sfc(_sfc_main$g, [["render", _sfc_render$f]]);
const _sfc_main$f = {
  components: {
    SchemaTimelineProxyInput,
    SchemaInput
  },
  name: "SchemaForm",
  props: {
    tkey: {},
    root: {
      required: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    row: {
      type: Boolean,
      default: false
    },
    schema: {
      type: Object,
      required: true
    },
    zod: {
      required: true
    },
    getRef: {
      type: Function,
      required: true
    }
  },
  data() {
    return {
      formRef: this.getRef()
    };
  },
  computed: {
    computedRoot() {
      return this.root || this.formRef;
    }
  },
  methods: {
    getShape(key) {
      try {
        if (this.zod.shape) {
          return this.zod.shape[key];
        } else {
          return this.zod._def.innerType.shape[key];
        }
      } catch (e) {
      }
    },
    capitalizeFirstLetter(v) {
      return v.charAt(0).toUpperCase() + v.slice(1).split(/(?=[A-Z])/).join(" ");
    },
    addArrayItem(key) {
      this.formRef[key].push("");
    }
  }
};
const _hoisted_1$b = { key: 0 };
const _hoisted_2$9 = { key: 0 };
const _hoisted_3$5 = ["title"];
const _hoisted_4$3 = ["title"];
function _sfc_render$e(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_SchemaForm = resolveComponent("SchemaForm", true);
  const _component_SchemaTimelineProxyInput = resolveComponent("SchemaTimelineProxyInput");
  return openBlock(), createElementBlock("div", {
    class: normalizeClass(["json_schema", {
      json_schema_row: $props.row
    }])
  }, [
    (openBlock(true), createElementBlock(Fragment, null, renderList($props.schema.properties, (field, key) => {
      return openBlock(), createElementBlock("div", { key }, [
        $data.formRef[key] != void 0 ? (openBlock(), createElementBlock("div", _hoisted_1$b, [
          field.type === "object" ? (openBlock(), createElementBlock("div", _hoisted_2$9, [
            createBaseVNode("fieldset", null, [
              createBaseVNode("legend", {
                title: $options.capitalizeFirstLetter(key)
              }, toDisplayString($options.capitalizeFirstLetter(key)), 9, _hoisted_3$5),
              createVNode(_component_SchemaForm, {
                tkey: $props.tkey,
                root: $options.computedRoot,
                disabled: $props.disabled,
                row: true,
                schema: field,
                "get-ref": () => $data.formRef[key],
                zod: $options.getShape(key)
              }, null, 8, ["tkey", "root", "disabled", "schema", "get-ref", "zod"])
            ])
          ])) : (openBlock(), createElementBlock("div", {
            key: 1,
            class: normalizeClass(["input_grid", {
              timeline: $options.computedRoot.___timeline
            }])
          }, [
            createBaseVNode("label", {
              title: $options.capitalizeFirstLetter(key)
            }, toDisplayString($options.capitalizeFirstLetter(key)), 9, _hoisted_4$3),
            createVNode(_component_SchemaTimelineProxyInput, {
              disabled: $props.disabled,
              "get-ref": $props.getRef,
              type: field.type,
              tkey: key,
              root: $options.computedRoot,
              allowtimeline: $props.tkey != "~ARTIFACT~",
              zod: $options.getShape(key),
              schema: $props.schema[key],
              placeholder: $options.capitalizeFirstLetter(key)
            }, null, 8, ["disabled", "get-ref", "type", "tkey", "root", "allowtimeline", "zod", "schema", "placeholder"])
          ], 2))
        ])) : createCommentVNode("", true)
      ]);
    }), 128))
  ], 2);
}
const SchemaForm = /* @__PURE__ */ _export_sfc(_sfc_main$f, [["render", _sfc_render$e], ["__scopeId", "data-v-3eeeeede"]]);
const _sfc_main$e = {
  props: ["timeline", "parent"],
  components: {
    PropertyTickControls
  },
  computed: {
    filteredKeys() {
      return Object.keys(this.parent).filter((key) => !key.startsWith("_"));
    },
    timeline_items() {
      let obj = {};
      for (let key of this.filteredKeys) {
        if (this.parent.hasOwnProperty(key)) {
          obj[key] = this.parent[key];
        }
      }
      return obj;
    }
  }
};
const _hoisted_1$a = { class: "properties" };
const _hoisted_2$8 = { key: 0 };
const _hoisted_3$4 = { key: 1 };
function _sfc_render$d(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_PropertyTickControls = resolveComponent("PropertyTickControls");
  const _component_Properties = resolveComponent("Properties", true);
  return openBlock(true), createElementBlock(Fragment, null, renderList($options.timeline_items, (item, key) => {
    return openBlock(), createElementBlock("div", _hoisted_1$a, [
      typeof item !== "object" ? (openBlock(), createElementBlock("p", _hoisted_2$8, [
        createVNode(_component_PropertyTickControls, {
          tkey: key,
          parent: $props.parent,
          timeline: $props.timeline
        }, null, 8, ["tkey", "parent", "timeline"]),
        createTextVNode(" " + toDisplayString(key), 1)
      ])) : (openBlock(), createElementBlock("div", _hoisted_3$4, [
        createBaseVNode("p", null, toDisplayString(key), 1),
        (openBlock(), createBlock(_component_Properties, {
          key,
          parent: item,
          timeline: $props.timeline
        }, null, 8, ["parent", "timeline"]))
      ]))
    ]);
  }), 256);
}
const Properties = /* @__PURE__ */ _export_sfc(_sfc_main$e, [["render", _sfc_render$d], ["__scopeId", "data-v-68105303"]]);
const _data = {
  draggableElementId: null,
  down: false,
  cursorPreviousX: 0,
  cursorPreviousY: 0,
  overlay: null,
  timestamp: 0
};
function createOverlay(e, el, _data2) {
  const overlay = document.createElement("div");
  overlay.setAttribute("style", `
    width: 100vw; 
    height: 100vh; 
    position: fixed;
    top: 0;
    left: 0;
    z-index: 99999999;
  `);
  overlay.addEventListener("mouseup", (e2) => mouseup(e2, el, _data2));
  overlay.addEventListener("mousedown", (e2) => mousedown(e2, el, _data2));
  overlay.addEventListener("mousemove", (e2) => mousemove(e2, el, _data2));
  document.body.appendChild(overlay);
  return overlay;
}
function checkIfIdInPath(id, path) {
  for (let i = 0; i < path.length; i++) {
    if (path[i].id === id) {
      return true;
    }
  }
  return false;
}
function mousedown(e, el, _data2) {
  if (e.button != 0) {
    return;
  }
  if (_data2.draggableElementId && !checkIfIdInPath(_data2.draggableElementId, e.composedPath())) {
    return;
  }
  _data2.offsetX = e.offsetX;
  _data2.offsetY = e.offsetY;
  _data2.timestamp = performance.now();
  const clickEvent = new CustomEvent("draggingstart", {
    detail: { x: e.clientX, y: e.clientY, offsetX: _data2.offsetX, offsetY: _data2.offsetY }
  });
  el.dispatchEvent(clickEvent);
  if (_data2.overlay) {
    _data2.overlay.remove();
  }
  _data2.down = true;
  _data2.cursorPreviousX = e.clientX;
  _data2.cursorPreviousY = e.clientY;
  const overlay = createOverlay(e, el, _data2);
  _data2.overlay = overlay;
}
function mouseup(e, el, _data2) {
  _data2.down = false;
  if (performance.now() - _data2.timestamp < 100) {
    const clickEvent2 = new CustomEvent("draggingclick", {
      detail: { x: e.clientX, y: e.clientY, offsetX: _data2.offsetX, offsetY: _data2.offsetY }
    });
    el.dispatchEvent(clickEvent2);
  }
  const clickEvent = new CustomEvent("draggingend", {});
  el.dispatchEvent(clickEvent);
  _data2.timestamp = performance.now();
  if (_data2.overlay) {
    _data2.overlay.removeEventListener("mouseup", mouseup);
    _data2.overlay.removeEventListener("mousedown", mousedown);
    _data2.overlay.removeEventListener("mousemove", mousemove);
    _data2.overlay.remove();
  }
}
function mousemove(e, el, _data2) {
  if (_data2.down) {
    const deltaX = e.clientX - _data2.cursorPreviousX;
    const deltaY = e.clientY - _data2.cursorPreviousY;
    const dragEvent = new CustomEvent("dragging", {
      detail: { deltaX, deltaY }
    });
    el.dispatchEvent(dragEvent);
    _data2.cursorPreviousX = e.clientX;
    _data2.cursorPreviousY = e.clientY;
  }
}
const drag = {
  mounted(el, binding) {
    _data.draggableElementId = binding.arg || null;
    el.addEventListener("mouseup", (e) => mouseup(e, el, _data));
    el.addEventListener("mousedown", (e) => mousedown(e, el, _data));
    el.addEventListener("mousemove", (e) => mousemove(e, el, _data));
  },
  beforeUnmount(el) {
    el.removeEventListener("mouseup", mouseup);
    el.removeEventListener("mousedown", mousedown);
    el.removeEventListener("mousemove", mousemove);
  }
};
const HANDLERS_PROPERTY = "__v-click-outside";
const HAS_WINDOWS = typeof window !== "undefined";
const HAS_NAVIGATOR = typeof navigator !== "undefined";
const IS_TOUCH = HAS_WINDOWS && ("ontouchstart" in window || HAS_NAVIGATOR && navigator.msMaxTouchPoints > 0);
const EVENTS = IS_TOUCH ? ["touchstart"] : ["click"];
const processDirectiveArguments = (bindingValue) => {
  const isFunction = typeof bindingValue === "function";
  if (!isFunction && typeof bindingValue !== "object") {
    throw new Error(
      "v-click-outside: Binding value must be a function or an object"
    );
  }
  return {
    handler: isFunction ? bindingValue : bindingValue.handler,
    middleware: bindingValue.middleware || ((item) => item),
    events: bindingValue.events || EVENTS,
    isActive: !(bindingValue.isActive === false),
    detectIframe: !(bindingValue.detectIframe === false),
    capture: Boolean(bindingValue.capture)
  };
};
const execHandler = ({ event: event2, handler, middleware }) => {
  if (middleware(event2)) {
    handler(event2);
  }
};
const onFauxIframeClick = ({ el, event: event2, handler, middleware }) => {
  setTimeout(() => {
    const { activeElement } = document;
    if (activeElement && activeElement.tagName === "IFRAME" && !el.contains(activeElement)) {
      execHandler({ event: event2, handler, middleware });
    }
  }, 0);
};
const onEvent = ({ el, event: event2, handler, middleware }) => {
  const path = event2.path || event2.composedPath && event2.composedPath();
  const isClickOutside = path ? path.indexOf(el) < 0 : !el.contains(event2.target);
  if (!isClickOutside) {
    return;
  }
  execHandler({ event: event2, handler, middleware });
};
const beforeMount = (el, { value }) => {
  const {
    events,
    handler,
    middleware,
    isActive,
    detectIframe,
    capture
  } = processDirectiveArguments(value);
  if (!isActive) {
    return;
  }
  el[HANDLERS_PROPERTY] = events.map((eventName) => ({
    event: eventName,
    srcTarget: document.documentElement,
    handler: (event2) => onEvent({ el, event: event2, handler, middleware }),
    capture
  }));
  if (detectIframe) {
    const detectIframeEvent = {
      event: "blur",
      srcTarget: window,
      handler: (event2) => onFauxIframeClick({ el, event: event2, handler, middleware }),
      capture
    };
    el[HANDLERS_PROPERTY] = [...el[HANDLERS_PROPERTY], detectIframeEvent];
  }
  el[HANDLERS_PROPERTY].forEach(
    ({ event: event2, srcTarget, handler: thisHandler }) => setTimeout(() => {
      if (!el[HANDLERS_PROPERTY]) {
        return;
      }
      srcTarget.addEventListener(event2, thisHandler, capture);
    }, 0)
  );
};
const unmounted = (el) => {
  const handlers = el[HANDLERS_PROPERTY] || [];
  handlers.forEach(
    ({ event: event2, srcTarget, handler, capture }) => srcTarget.removeEventListener(event2, handler, capture)
  );
  delete el[HANDLERS_PROPERTY];
};
const updated = (el, { value, oldValue }) => {
  if (JSON.stringify(value) === JSON.stringify(oldValue)) {
    return;
  }
  unmounted(el);
  beforeMount(el, { value });
};
const directive = {
  beforeMount,
  updated,
  unmounted
};
const clickOutside = HAS_WINDOWS ? directive : {};
const PRESET_TYPE_LINEAR = "linear";
const PRESET_TYPE_EASE_IN_OUT = "ease-in-out";
const PRESET_TYPE_EASE_IN = "ease-in";
const PRESET_TYPE_EASE_OUT = "ease-out";
const PRESET_TYPES = [
  PRESET_TYPE_EASE_IN_OUT,
  PRESET_TYPE_EASE_IN,
  PRESET_TYPE_EASE_OUT
];
const PRESET_LIST_LINEAR = [
  {
    name: PRESET_TYPE_LINEAR,
    value: [0, 0, 1, 1]
  },
  {
    name: "Linear",
    value: [0, 0, 1, 1]
  }
];
const PRESET_LIST_EASE_IN_OUT = [
  {
    name: PRESET_TYPE_EASE_IN_OUT,
    value: [0.42, 0, 0.58, 1]
  },
  {
    name: "linear",
    value: [0, 0, 1, 1]
  },
  {
    name: "In Out · Sine",
    value: [0.45, 0.05, 0.55, 0.95]
  },
  {
    name: "In Out · Quadratic",
    value: [0.46, 0.03, 0.52, 0.96]
  },
  {
    name: "In Out · Cubic",
    value: [0.65, 0.05, 0.36, 1]
  },
  {
    name: "Fast Out, Slow In",
    value: [0.4, 0, 0.2, 1]
  },
  {
    name: "In Out · Back",
    value: [0.68, -0.55, 0.27, 1.55]
  }
];
const PRESET_LIST_EASE_IN = [
  {
    name: PRESET_TYPE_EASE_IN,
    value: [0.42, 0, 1, 1]
  },
  {
    name: "In · Sine",
    value: [0.47, 0, 0.75, 0.72]
  },
  {
    name: "In · Quadratic",
    value: [0.55, 0.09, 0.68, 0.53]
  },
  {
    name: "In · Cubic",
    value: [0.55, 0.06, 0.68, 0.19]
  },
  {
    name: "In · Back",
    value: [0.6, -0.28, 0.74, 0.05]
  },
  {
    name: "Fast Out, Linear In",
    value: [0.4, 0, 1, 1]
  }
];
const PRESET_LIST_EASE_OUT = [
  {
    name: PRESET_TYPE_EASE_OUT,
    value: [0, 0, 0.58, 1]
  },
  {
    name: "Out · Sine",
    value: [0.39, 0.58, 0.57, 1]
  },
  {
    name: "Out · Quadratic",
    value: [0.25, 0.46, 0.45, 0.94]
  },
  {
    name: "Out · Cubic",
    value: [0.22, 0.61, 0.36, 1]
  },
  {
    name: "Linear Out, Slow In",
    value: [0, 0, 0.2, 1]
  },
  {
    name: "Out · Back",
    value: [0.18, 0.89, 0.32, 1.28]
  }
];
const PRESET_LISTS = {
  [PRESET_TYPE_EASE_IN_OUT]: PRESET_LIST_EASE_IN_OUT,
  [PRESET_TYPE_EASE_IN]: PRESET_LIST_EASE_IN,
  [PRESET_TYPE_EASE_OUT]: PRESET_LIST_EASE_OUT,
  [PRESET_TYPE_LINEAR]: PRESET_LIST_LINEAR
};
const usePresets = (callback, cubicBezierValue) => {
  const presetTypes = PRESET_TYPES;
  const selectedPresetType = ref(null);
  const cssDefinedEasing = ref(null);
  const devToolDefinedEasing = ref(null);
  const selectedPresetIndex = ref({
    [PRESET_TYPE_EASE_IN_OUT]: 0,
    [PRESET_TYPE_EASE_IN]: 0,
    [PRESET_TYPE_EASE_OUT]: 0
  });
  const applyPreset = (name) => {
    const appliedPreset = PRESET_LISTS[name][selectedPresetIndex.value[name]];
    selectedPresetType.value = name;
    devToolDefinedEasing.value = appliedPreset.name;
    cssDefinedEasing.value = selectedPresetIndex.value[name] === 0 ? name : null;
    callback(appliedPreset.value);
  };
  const changePreset = (count) => {
    if (!selectedPresetType.value) {
      return;
    }
    const currentIndex = selectedPresetIndex.value[selectedPresetType.value];
    const selectedPresetList = PRESET_LISTS[selectedPresetType.value];
    const nextIndex = currentIndex + count === selectedPresetList.length ? 0 : currentIndex + count === -1 ? selectedPresetList.length - 1 : currentIndex + count;
    const nextSelectedPresetIndex = {
      ...selectedPresetIndex.value,
      [selectedPresetType.value]: nextIndex
    };
    const selectedPreset = selectedPresetList[nextSelectedPresetIndex[selectedPresetType.value]];
    cssDefinedEasing.value = nextIndex === 0 ? selectedPreset.name : null;
    devToolDefinedEasing.value = selectedPreset.name;
    selectedPresetIndex.value = nextSelectedPresetIndex;
    callback(selectedPreset.value);
  };
  const resetPreset = () => {
    selectedPresetType.value = null;
    cssDefinedEasing.value = null;
    devToolDefinedEasing.value = null;
  };
  const displayValue = computed(() => {
    if (devToolDefinedEasing.value) {
      return devToolDefinedEasing.value;
    } else if (cssDefinedEasing.value) {
      return cssDefinedEasing.value;
    } else {
      return `cubic-bezier(${cubicBezierValue.value.join(", ")})`;
    }
  });
  return {
    presetTypes,
    selectedPresetType,
    selectedPresetIndex,
    applyPreset,
    changePreset,
    resetPreset,
    displayValue
  };
};
var _baseClamp;
var hasRequired_baseClamp;
function require_baseClamp() {
  if (hasRequired_baseClamp) return _baseClamp;
  hasRequired_baseClamp = 1;
  function baseClamp(number, lower, upper) {
    if (number === number) {
      if (upper !== void 0) {
        number = number <= upper ? number : upper;
      }
      if (lower !== void 0) {
        number = number >= lower ? number : lower;
      }
    }
    return number;
  }
  _baseClamp = baseClamp;
  return _baseClamp;
}
var _trimmedEndIndex;
var hasRequired_trimmedEndIndex;
function require_trimmedEndIndex() {
  if (hasRequired_trimmedEndIndex) return _trimmedEndIndex;
  hasRequired_trimmedEndIndex = 1;
  var reWhitespace = /\s/;
  function trimmedEndIndex(string) {
    var index = string.length;
    while (index-- && reWhitespace.test(string.charAt(index))) {
    }
    return index;
  }
  _trimmedEndIndex = trimmedEndIndex;
  return _trimmedEndIndex;
}
var _baseTrim;
var hasRequired_baseTrim;
function require_baseTrim() {
  if (hasRequired_baseTrim) return _baseTrim;
  hasRequired_baseTrim = 1;
  var trimmedEndIndex = require_trimmedEndIndex();
  var reTrimStart = /^\s+/;
  function baseTrim(string) {
    return string ? string.slice(0, trimmedEndIndex(string) + 1).replace(reTrimStart, "") : string;
  }
  _baseTrim = baseTrim;
  return _baseTrim;
}
var isObject_1;
var hasRequiredIsObject;
function requireIsObject() {
  if (hasRequiredIsObject) return isObject_1;
  hasRequiredIsObject = 1;
  function isObject(value) {
    var type = typeof value;
    return value != null && (type == "object" || type == "function");
  }
  isObject_1 = isObject;
  return isObject_1;
}
var _freeGlobal;
var hasRequired_freeGlobal;
function require_freeGlobal() {
  if (hasRequired_freeGlobal) return _freeGlobal;
  hasRequired_freeGlobal = 1;
  var freeGlobal = typeof globalThis == "object" && globalThis && globalThis.Object === Object && globalThis;
  _freeGlobal = freeGlobal;
  return _freeGlobal;
}
var _root;
var hasRequired_root;
function require_root() {
  if (hasRequired_root) return _root;
  hasRequired_root = 1;
  var freeGlobal = require_freeGlobal();
  var freeSelf = typeof self == "object" && self && self.Object === Object && self;
  var root = freeGlobal || freeSelf || Function("return this")();
  _root = root;
  return _root;
}
var _Symbol;
var hasRequired_Symbol;
function require_Symbol() {
  if (hasRequired_Symbol) return _Symbol;
  hasRequired_Symbol = 1;
  var root = require_root();
  var Symbol2 = root.Symbol;
  _Symbol = Symbol2;
  return _Symbol;
}
var _getRawTag;
var hasRequired_getRawTag;
function require_getRawTag() {
  if (hasRequired_getRawTag) return _getRawTag;
  hasRequired_getRawTag = 1;
  var Symbol2 = require_Symbol();
  var objectProto = Object.prototype;
  var hasOwnProperty = objectProto.hasOwnProperty;
  var nativeObjectToString = objectProto.toString;
  var symToStringTag = Symbol2 ? Symbol2.toStringTag : void 0;
  function getRawTag(value) {
    var isOwn = hasOwnProperty.call(value, symToStringTag), tag = value[symToStringTag];
    try {
      value[symToStringTag] = void 0;
      var unmasked = true;
    } catch (e) {
    }
    var result = nativeObjectToString.call(value);
    if (unmasked) {
      if (isOwn) {
        value[symToStringTag] = tag;
      } else {
        delete value[symToStringTag];
      }
    }
    return result;
  }
  _getRawTag = getRawTag;
  return _getRawTag;
}
var _objectToString;
var hasRequired_objectToString;
function require_objectToString() {
  if (hasRequired_objectToString) return _objectToString;
  hasRequired_objectToString = 1;
  var objectProto = Object.prototype;
  var nativeObjectToString = objectProto.toString;
  function objectToString(value) {
    return nativeObjectToString.call(value);
  }
  _objectToString = objectToString;
  return _objectToString;
}
var _baseGetTag;
var hasRequired_baseGetTag;
function require_baseGetTag() {
  if (hasRequired_baseGetTag) return _baseGetTag;
  hasRequired_baseGetTag = 1;
  var Symbol2 = require_Symbol(), getRawTag = require_getRawTag(), objectToString = require_objectToString();
  var nullTag = "[object Null]", undefinedTag = "[object Undefined]";
  var symToStringTag = Symbol2 ? Symbol2.toStringTag : void 0;
  function baseGetTag(value) {
    if (value == null) {
      return value === void 0 ? undefinedTag : nullTag;
    }
    return symToStringTag && symToStringTag in Object(value) ? getRawTag(value) : objectToString(value);
  }
  _baseGetTag = baseGetTag;
  return _baseGetTag;
}
var isObjectLike_1;
var hasRequiredIsObjectLike;
function requireIsObjectLike() {
  if (hasRequiredIsObjectLike) return isObjectLike_1;
  hasRequiredIsObjectLike = 1;
  function isObjectLike(value) {
    return value != null && typeof value == "object";
  }
  isObjectLike_1 = isObjectLike;
  return isObjectLike_1;
}
var isSymbol_1;
var hasRequiredIsSymbol;
function requireIsSymbol() {
  if (hasRequiredIsSymbol) return isSymbol_1;
  hasRequiredIsSymbol = 1;
  var baseGetTag = require_baseGetTag(), isObjectLike = requireIsObjectLike();
  var symbolTag = "[object Symbol]";
  function isSymbol(value) {
    return typeof value == "symbol" || isObjectLike(value) && baseGetTag(value) == symbolTag;
  }
  isSymbol_1 = isSymbol;
  return isSymbol_1;
}
var toNumber_1;
var hasRequiredToNumber;
function requireToNumber() {
  if (hasRequiredToNumber) return toNumber_1;
  hasRequiredToNumber = 1;
  var baseTrim = require_baseTrim(), isObject = requireIsObject(), isSymbol = requireIsSymbol();
  var NAN = 0 / 0;
  var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
  var reIsBinary = /^0b[01]+$/i;
  var reIsOctal = /^0o[0-7]+$/i;
  var freeParseInt = parseInt;
  function toNumber(value) {
    if (typeof value == "number") {
      return value;
    }
    if (isSymbol(value)) {
      return NAN;
    }
    if (isObject(value)) {
      var other = typeof value.valueOf == "function" ? value.valueOf() : value;
      value = isObject(other) ? other + "" : other;
    }
    if (typeof value != "string") {
      return value === 0 ? value : +value;
    }
    value = baseTrim(value);
    var isBinary = reIsBinary.test(value);
    return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
  }
  toNumber_1 = toNumber;
  return toNumber_1;
}
var clamp_1;
var hasRequiredClamp;
function requireClamp() {
  if (hasRequiredClamp) return clamp_1;
  hasRequiredClamp = 1;
  var baseClamp = require_baseClamp(), toNumber = requireToNumber();
  function clamp2(number, lower, upper) {
    if (upper === void 0) {
      upper = lower;
      lower = void 0;
    }
    if (upper !== void 0) {
      upper = toNumber(upper);
      upper = upper === upper ? upper : 0;
    }
    if (lower !== void 0) {
      lower = toNumber(lower);
      lower = lower === lower ? lower : 0;
    }
    return baseClamp(toNumber(number), lower, upper);
  }
  clamp_1 = clamp2;
  return clamp_1;
}
var clampExports = requireClamp();
const clamp = /* @__PURE__ */ getDefaultExportFromCjs(clampExports);
var _listCacheClear;
var hasRequired_listCacheClear;
function require_listCacheClear() {
  if (hasRequired_listCacheClear) return _listCacheClear;
  hasRequired_listCacheClear = 1;
  function listCacheClear() {
    this.__data__ = [];
    this.size = 0;
  }
  _listCacheClear = listCacheClear;
  return _listCacheClear;
}
var eq_1;
var hasRequiredEq;
function requireEq() {
  if (hasRequiredEq) return eq_1;
  hasRequiredEq = 1;
  function eq(value, other) {
    return value === other || value !== value && other !== other;
  }
  eq_1 = eq;
  return eq_1;
}
var _assocIndexOf;
var hasRequired_assocIndexOf;
function require_assocIndexOf() {
  if (hasRequired_assocIndexOf) return _assocIndexOf;
  hasRequired_assocIndexOf = 1;
  var eq = requireEq();
  function assocIndexOf(array, key) {
    var length = array.length;
    while (length--) {
      if (eq(array[length][0], key)) {
        return length;
      }
    }
    return -1;
  }
  _assocIndexOf = assocIndexOf;
  return _assocIndexOf;
}
var _listCacheDelete;
var hasRequired_listCacheDelete;
function require_listCacheDelete() {
  if (hasRequired_listCacheDelete) return _listCacheDelete;
  hasRequired_listCacheDelete = 1;
  var assocIndexOf = require_assocIndexOf();
  var arrayProto = Array.prototype;
  var splice = arrayProto.splice;
  function listCacheDelete(key) {
    var data = this.__data__, index = assocIndexOf(data, key);
    if (index < 0) {
      return false;
    }
    var lastIndex = data.length - 1;
    if (index == lastIndex) {
      data.pop();
    } else {
      splice.call(data, index, 1);
    }
    --this.size;
    return true;
  }
  _listCacheDelete = listCacheDelete;
  return _listCacheDelete;
}
var _listCacheGet;
var hasRequired_listCacheGet;
function require_listCacheGet() {
  if (hasRequired_listCacheGet) return _listCacheGet;
  hasRequired_listCacheGet = 1;
  var assocIndexOf = require_assocIndexOf();
  function listCacheGet(key) {
    var data = this.__data__, index = assocIndexOf(data, key);
    return index < 0 ? void 0 : data[index][1];
  }
  _listCacheGet = listCacheGet;
  return _listCacheGet;
}
var _listCacheHas;
var hasRequired_listCacheHas;
function require_listCacheHas() {
  if (hasRequired_listCacheHas) return _listCacheHas;
  hasRequired_listCacheHas = 1;
  var assocIndexOf = require_assocIndexOf();
  function listCacheHas(key) {
    return assocIndexOf(this.__data__, key) > -1;
  }
  _listCacheHas = listCacheHas;
  return _listCacheHas;
}
var _listCacheSet;
var hasRequired_listCacheSet;
function require_listCacheSet() {
  if (hasRequired_listCacheSet) return _listCacheSet;
  hasRequired_listCacheSet = 1;
  var assocIndexOf = require_assocIndexOf();
  function listCacheSet(key, value) {
    var data = this.__data__, index = assocIndexOf(data, key);
    if (index < 0) {
      ++this.size;
      data.push([key, value]);
    } else {
      data[index][1] = value;
    }
    return this;
  }
  _listCacheSet = listCacheSet;
  return _listCacheSet;
}
var _ListCache;
var hasRequired_ListCache;
function require_ListCache() {
  if (hasRequired_ListCache) return _ListCache;
  hasRequired_ListCache = 1;
  var listCacheClear = require_listCacheClear(), listCacheDelete = require_listCacheDelete(), listCacheGet = require_listCacheGet(), listCacheHas = require_listCacheHas(), listCacheSet = require_listCacheSet();
  function ListCache(entries) {
    var index = -1, length = entries == null ? 0 : entries.length;
    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }
  ListCache.prototype.clear = listCacheClear;
  ListCache.prototype["delete"] = listCacheDelete;
  ListCache.prototype.get = listCacheGet;
  ListCache.prototype.has = listCacheHas;
  ListCache.prototype.set = listCacheSet;
  _ListCache = ListCache;
  return _ListCache;
}
var _stackClear;
var hasRequired_stackClear;
function require_stackClear() {
  if (hasRequired_stackClear) return _stackClear;
  hasRequired_stackClear = 1;
  var ListCache = require_ListCache();
  function stackClear() {
    this.__data__ = new ListCache();
    this.size = 0;
  }
  _stackClear = stackClear;
  return _stackClear;
}
var _stackDelete;
var hasRequired_stackDelete;
function require_stackDelete() {
  if (hasRequired_stackDelete) return _stackDelete;
  hasRequired_stackDelete = 1;
  function stackDelete(key) {
    var data = this.__data__, result = data["delete"](key);
    this.size = data.size;
    return result;
  }
  _stackDelete = stackDelete;
  return _stackDelete;
}
var _stackGet;
var hasRequired_stackGet;
function require_stackGet() {
  if (hasRequired_stackGet) return _stackGet;
  hasRequired_stackGet = 1;
  function stackGet(key) {
    return this.__data__.get(key);
  }
  _stackGet = stackGet;
  return _stackGet;
}
var _stackHas;
var hasRequired_stackHas;
function require_stackHas() {
  if (hasRequired_stackHas) return _stackHas;
  hasRequired_stackHas = 1;
  function stackHas(key) {
    return this.__data__.has(key);
  }
  _stackHas = stackHas;
  return _stackHas;
}
var isFunction_1;
var hasRequiredIsFunction;
function requireIsFunction() {
  if (hasRequiredIsFunction) return isFunction_1;
  hasRequiredIsFunction = 1;
  var baseGetTag = require_baseGetTag(), isObject = requireIsObject();
  var asyncTag = "[object AsyncFunction]", funcTag = "[object Function]", genTag = "[object GeneratorFunction]", proxyTag = "[object Proxy]";
  function isFunction(value) {
    if (!isObject(value)) {
      return false;
    }
    var tag = baseGetTag(value);
    return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
  }
  isFunction_1 = isFunction;
  return isFunction_1;
}
var _coreJsData;
var hasRequired_coreJsData;
function require_coreJsData() {
  if (hasRequired_coreJsData) return _coreJsData;
  hasRequired_coreJsData = 1;
  var root = require_root();
  var coreJsData = root["__core-js_shared__"];
  _coreJsData = coreJsData;
  return _coreJsData;
}
var _isMasked;
var hasRequired_isMasked;
function require_isMasked() {
  if (hasRequired_isMasked) return _isMasked;
  hasRequired_isMasked = 1;
  var coreJsData = require_coreJsData();
  var maskSrcKey = (function() {
    var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || "");
    return uid ? "Symbol(src)_1." + uid : "";
  })();
  function isMasked(func) {
    return !!maskSrcKey && maskSrcKey in func;
  }
  _isMasked = isMasked;
  return _isMasked;
}
var _toSource;
var hasRequired_toSource;
function require_toSource() {
  if (hasRequired_toSource) return _toSource;
  hasRequired_toSource = 1;
  var funcProto = Function.prototype;
  var funcToString = funcProto.toString;
  function toSource(func) {
    if (func != null) {
      try {
        return funcToString.call(func);
      } catch (e) {
      }
      try {
        return func + "";
      } catch (e) {
      }
    }
    return "";
  }
  _toSource = toSource;
  return _toSource;
}
var _baseIsNative;
var hasRequired_baseIsNative;
function require_baseIsNative() {
  if (hasRequired_baseIsNative) return _baseIsNative;
  hasRequired_baseIsNative = 1;
  var isFunction = requireIsFunction(), isMasked = require_isMasked(), isObject = requireIsObject(), toSource = require_toSource();
  var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
  var reIsHostCtor = /^\[object .+?Constructor\]$/;
  var funcProto = Function.prototype, objectProto = Object.prototype;
  var funcToString = funcProto.toString;
  var hasOwnProperty = objectProto.hasOwnProperty;
  var reIsNative = RegExp(
    "^" + funcToString.call(hasOwnProperty).replace(reRegExpChar, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
  );
  function baseIsNative(value) {
    if (!isObject(value) || isMasked(value)) {
      return false;
    }
    var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
    return pattern.test(toSource(value));
  }
  _baseIsNative = baseIsNative;
  return _baseIsNative;
}
var _getValue;
var hasRequired_getValue;
function require_getValue() {
  if (hasRequired_getValue) return _getValue;
  hasRequired_getValue = 1;
  function getValue(object, key) {
    return object == null ? void 0 : object[key];
  }
  _getValue = getValue;
  return _getValue;
}
var _getNative;
var hasRequired_getNative;
function require_getNative() {
  if (hasRequired_getNative) return _getNative;
  hasRequired_getNative = 1;
  var baseIsNative = require_baseIsNative(), getValue = require_getValue();
  function getNative(object, key) {
    var value = getValue(object, key);
    return baseIsNative(value) ? value : void 0;
  }
  _getNative = getNative;
  return _getNative;
}
var _Map;
var hasRequired_Map;
function require_Map() {
  if (hasRequired_Map) return _Map;
  hasRequired_Map = 1;
  var getNative = require_getNative(), root = require_root();
  var Map2 = getNative(root, "Map");
  _Map = Map2;
  return _Map;
}
var _nativeCreate;
var hasRequired_nativeCreate;
function require_nativeCreate() {
  if (hasRequired_nativeCreate) return _nativeCreate;
  hasRequired_nativeCreate = 1;
  var getNative = require_getNative();
  var nativeCreate = getNative(Object, "create");
  _nativeCreate = nativeCreate;
  return _nativeCreate;
}
var _hashClear;
var hasRequired_hashClear;
function require_hashClear() {
  if (hasRequired_hashClear) return _hashClear;
  hasRequired_hashClear = 1;
  var nativeCreate = require_nativeCreate();
  function hashClear() {
    this.__data__ = nativeCreate ? nativeCreate(null) : {};
    this.size = 0;
  }
  _hashClear = hashClear;
  return _hashClear;
}
var _hashDelete;
var hasRequired_hashDelete;
function require_hashDelete() {
  if (hasRequired_hashDelete) return _hashDelete;
  hasRequired_hashDelete = 1;
  function hashDelete(key) {
    var result = this.has(key) && delete this.__data__[key];
    this.size -= result ? 1 : 0;
    return result;
  }
  _hashDelete = hashDelete;
  return _hashDelete;
}
var _hashGet;
var hasRequired_hashGet;
function require_hashGet() {
  if (hasRequired_hashGet) return _hashGet;
  hasRequired_hashGet = 1;
  var nativeCreate = require_nativeCreate();
  var HASH_UNDEFINED = "__lodash_hash_undefined__";
  var objectProto = Object.prototype;
  var hasOwnProperty = objectProto.hasOwnProperty;
  function hashGet(key) {
    var data = this.__data__;
    if (nativeCreate) {
      var result = data[key];
      return result === HASH_UNDEFINED ? void 0 : result;
    }
    return hasOwnProperty.call(data, key) ? data[key] : void 0;
  }
  _hashGet = hashGet;
  return _hashGet;
}
var _hashHas;
var hasRequired_hashHas;
function require_hashHas() {
  if (hasRequired_hashHas) return _hashHas;
  hasRequired_hashHas = 1;
  var nativeCreate = require_nativeCreate();
  var objectProto = Object.prototype;
  var hasOwnProperty = objectProto.hasOwnProperty;
  function hashHas(key) {
    var data = this.__data__;
    return nativeCreate ? data[key] !== void 0 : hasOwnProperty.call(data, key);
  }
  _hashHas = hashHas;
  return _hashHas;
}
var _hashSet;
var hasRequired_hashSet;
function require_hashSet() {
  if (hasRequired_hashSet) return _hashSet;
  hasRequired_hashSet = 1;
  var nativeCreate = require_nativeCreate();
  var HASH_UNDEFINED = "__lodash_hash_undefined__";
  function hashSet(key, value) {
    var data = this.__data__;
    this.size += this.has(key) ? 0 : 1;
    data[key] = nativeCreate && value === void 0 ? HASH_UNDEFINED : value;
    return this;
  }
  _hashSet = hashSet;
  return _hashSet;
}
var _Hash;
var hasRequired_Hash;
function require_Hash() {
  if (hasRequired_Hash) return _Hash;
  hasRequired_Hash = 1;
  var hashClear = require_hashClear(), hashDelete = require_hashDelete(), hashGet = require_hashGet(), hashHas = require_hashHas(), hashSet = require_hashSet();
  function Hash(entries) {
    var index = -1, length = entries == null ? 0 : entries.length;
    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }
  Hash.prototype.clear = hashClear;
  Hash.prototype["delete"] = hashDelete;
  Hash.prototype.get = hashGet;
  Hash.prototype.has = hashHas;
  Hash.prototype.set = hashSet;
  _Hash = Hash;
  return _Hash;
}
var _mapCacheClear;
var hasRequired_mapCacheClear;
function require_mapCacheClear() {
  if (hasRequired_mapCacheClear) return _mapCacheClear;
  hasRequired_mapCacheClear = 1;
  var Hash = require_Hash(), ListCache = require_ListCache(), Map2 = require_Map();
  function mapCacheClear() {
    this.size = 0;
    this.__data__ = {
      "hash": new Hash(),
      "map": new (Map2 || ListCache)(),
      "string": new Hash()
    };
  }
  _mapCacheClear = mapCacheClear;
  return _mapCacheClear;
}
var _isKeyable;
var hasRequired_isKeyable;
function require_isKeyable() {
  if (hasRequired_isKeyable) return _isKeyable;
  hasRequired_isKeyable = 1;
  function isKeyable(value) {
    var type = typeof value;
    return type == "string" || type == "number" || type == "symbol" || type == "boolean" ? value !== "__proto__" : value === null;
  }
  _isKeyable = isKeyable;
  return _isKeyable;
}
var _getMapData;
var hasRequired_getMapData;
function require_getMapData() {
  if (hasRequired_getMapData) return _getMapData;
  hasRequired_getMapData = 1;
  var isKeyable = require_isKeyable();
  function getMapData(map, key) {
    var data = map.__data__;
    return isKeyable(key) ? data[typeof key == "string" ? "string" : "hash"] : data.map;
  }
  _getMapData = getMapData;
  return _getMapData;
}
var _mapCacheDelete;
var hasRequired_mapCacheDelete;
function require_mapCacheDelete() {
  if (hasRequired_mapCacheDelete) return _mapCacheDelete;
  hasRequired_mapCacheDelete = 1;
  var getMapData = require_getMapData();
  function mapCacheDelete(key) {
    var result = getMapData(this, key)["delete"](key);
    this.size -= result ? 1 : 0;
    return result;
  }
  _mapCacheDelete = mapCacheDelete;
  return _mapCacheDelete;
}
var _mapCacheGet;
var hasRequired_mapCacheGet;
function require_mapCacheGet() {
  if (hasRequired_mapCacheGet) return _mapCacheGet;
  hasRequired_mapCacheGet = 1;
  var getMapData = require_getMapData();
  function mapCacheGet(key) {
    return getMapData(this, key).get(key);
  }
  _mapCacheGet = mapCacheGet;
  return _mapCacheGet;
}
var _mapCacheHas;
var hasRequired_mapCacheHas;
function require_mapCacheHas() {
  if (hasRequired_mapCacheHas) return _mapCacheHas;
  hasRequired_mapCacheHas = 1;
  var getMapData = require_getMapData();
  function mapCacheHas(key) {
    return getMapData(this, key).has(key);
  }
  _mapCacheHas = mapCacheHas;
  return _mapCacheHas;
}
var _mapCacheSet;
var hasRequired_mapCacheSet;
function require_mapCacheSet() {
  if (hasRequired_mapCacheSet) return _mapCacheSet;
  hasRequired_mapCacheSet = 1;
  var getMapData = require_getMapData();
  function mapCacheSet(key, value) {
    var data = getMapData(this, key), size = data.size;
    data.set(key, value);
    this.size += data.size == size ? 0 : 1;
    return this;
  }
  _mapCacheSet = mapCacheSet;
  return _mapCacheSet;
}
var _MapCache;
var hasRequired_MapCache;
function require_MapCache() {
  if (hasRequired_MapCache) return _MapCache;
  hasRequired_MapCache = 1;
  var mapCacheClear = require_mapCacheClear(), mapCacheDelete = require_mapCacheDelete(), mapCacheGet = require_mapCacheGet(), mapCacheHas = require_mapCacheHas(), mapCacheSet = require_mapCacheSet();
  function MapCache(entries) {
    var index = -1, length = entries == null ? 0 : entries.length;
    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }
  MapCache.prototype.clear = mapCacheClear;
  MapCache.prototype["delete"] = mapCacheDelete;
  MapCache.prototype.get = mapCacheGet;
  MapCache.prototype.has = mapCacheHas;
  MapCache.prototype.set = mapCacheSet;
  _MapCache = MapCache;
  return _MapCache;
}
var _stackSet;
var hasRequired_stackSet;
function require_stackSet() {
  if (hasRequired_stackSet) return _stackSet;
  hasRequired_stackSet = 1;
  var ListCache = require_ListCache(), Map2 = require_Map(), MapCache = require_MapCache();
  var LARGE_ARRAY_SIZE = 200;
  function stackSet(key, value) {
    var data = this.__data__;
    if (data instanceof ListCache) {
      var pairs = data.__data__;
      if (!Map2 || pairs.length < LARGE_ARRAY_SIZE - 1) {
        pairs.push([key, value]);
        this.size = ++data.size;
        return this;
      }
      data = this.__data__ = new MapCache(pairs);
    }
    data.set(key, value);
    this.size = data.size;
    return this;
  }
  _stackSet = stackSet;
  return _stackSet;
}
var _Stack;
var hasRequired_Stack;
function require_Stack() {
  if (hasRequired_Stack) return _Stack;
  hasRequired_Stack = 1;
  var ListCache = require_ListCache(), stackClear = require_stackClear(), stackDelete = require_stackDelete(), stackGet = require_stackGet(), stackHas = require_stackHas(), stackSet = require_stackSet();
  function Stack(entries) {
    var data = this.__data__ = new ListCache(entries);
    this.size = data.size;
  }
  Stack.prototype.clear = stackClear;
  Stack.prototype["delete"] = stackDelete;
  Stack.prototype.get = stackGet;
  Stack.prototype.has = stackHas;
  Stack.prototype.set = stackSet;
  _Stack = Stack;
  return _Stack;
}
var _setCacheAdd;
var hasRequired_setCacheAdd;
function require_setCacheAdd() {
  if (hasRequired_setCacheAdd) return _setCacheAdd;
  hasRequired_setCacheAdd = 1;
  var HASH_UNDEFINED = "__lodash_hash_undefined__";
  function setCacheAdd(value) {
    this.__data__.set(value, HASH_UNDEFINED);
    return this;
  }
  _setCacheAdd = setCacheAdd;
  return _setCacheAdd;
}
var _setCacheHas;
var hasRequired_setCacheHas;
function require_setCacheHas() {
  if (hasRequired_setCacheHas) return _setCacheHas;
  hasRequired_setCacheHas = 1;
  function setCacheHas(value) {
    return this.__data__.has(value);
  }
  _setCacheHas = setCacheHas;
  return _setCacheHas;
}
var _SetCache;
var hasRequired_SetCache;
function require_SetCache() {
  if (hasRequired_SetCache) return _SetCache;
  hasRequired_SetCache = 1;
  var MapCache = require_MapCache(), setCacheAdd = require_setCacheAdd(), setCacheHas = require_setCacheHas();
  function SetCache(values) {
    var index = -1, length = values == null ? 0 : values.length;
    this.__data__ = new MapCache();
    while (++index < length) {
      this.add(values[index]);
    }
  }
  SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
  SetCache.prototype.has = setCacheHas;
  _SetCache = SetCache;
  return _SetCache;
}
var _arraySome;
var hasRequired_arraySome;
function require_arraySome() {
  if (hasRequired_arraySome) return _arraySome;
  hasRequired_arraySome = 1;
  function arraySome(array, predicate) {
    var index = -1, length = array == null ? 0 : array.length;
    while (++index < length) {
      if (predicate(array[index], index, array)) {
        return true;
      }
    }
    return false;
  }
  _arraySome = arraySome;
  return _arraySome;
}
var _cacheHas;
var hasRequired_cacheHas;
function require_cacheHas() {
  if (hasRequired_cacheHas) return _cacheHas;
  hasRequired_cacheHas = 1;
  function cacheHas(cache, key) {
    return cache.has(key);
  }
  _cacheHas = cacheHas;
  return _cacheHas;
}
var _equalArrays;
var hasRequired_equalArrays;
function require_equalArrays() {
  if (hasRequired_equalArrays) return _equalArrays;
  hasRequired_equalArrays = 1;
  var SetCache = require_SetCache(), arraySome = require_arraySome(), cacheHas = require_cacheHas();
  var COMPARE_PARTIAL_FLAG = 1, COMPARE_UNORDERED_FLAG = 2;
  function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
    var isPartial = bitmask & COMPARE_PARTIAL_FLAG, arrLength = array.length, othLength = other.length;
    if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
      return false;
    }
    var arrStacked = stack.get(array);
    var othStacked = stack.get(other);
    if (arrStacked && othStacked) {
      return arrStacked == other && othStacked == array;
    }
    var index = -1, result = true, seen = bitmask & COMPARE_UNORDERED_FLAG ? new SetCache() : void 0;
    stack.set(array, other);
    stack.set(other, array);
    while (++index < arrLength) {
      var arrValue = array[index], othValue = other[index];
      if (customizer) {
        var compared = isPartial ? customizer(othValue, arrValue, index, other, array, stack) : customizer(arrValue, othValue, index, array, other, stack);
      }
      if (compared !== void 0) {
        if (compared) {
          continue;
        }
        result = false;
        break;
      }
      if (seen) {
        if (!arraySome(other, function(othValue2, othIndex) {
          if (!cacheHas(seen, othIndex) && (arrValue === othValue2 || equalFunc(arrValue, othValue2, bitmask, customizer, stack))) {
            return seen.push(othIndex);
          }
        })) {
          result = false;
          break;
        }
      } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
        result = false;
        break;
      }
    }
    stack["delete"](array);
    stack["delete"](other);
    return result;
  }
  _equalArrays = equalArrays;
  return _equalArrays;
}
var _Uint8Array;
var hasRequired_Uint8Array;
function require_Uint8Array() {
  if (hasRequired_Uint8Array) return _Uint8Array;
  hasRequired_Uint8Array = 1;
  var root = require_root();
  var Uint8Array = root.Uint8Array;
  _Uint8Array = Uint8Array;
  return _Uint8Array;
}
var _mapToArray;
var hasRequired_mapToArray;
function require_mapToArray() {
  if (hasRequired_mapToArray) return _mapToArray;
  hasRequired_mapToArray = 1;
  function mapToArray(map) {
    var index = -1, result = Array(map.size);
    map.forEach(function(value, key) {
      result[++index] = [key, value];
    });
    return result;
  }
  _mapToArray = mapToArray;
  return _mapToArray;
}
var _setToArray;
var hasRequired_setToArray;
function require_setToArray() {
  if (hasRequired_setToArray) return _setToArray;
  hasRequired_setToArray = 1;
  function setToArray(set) {
    var index = -1, result = Array(set.size);
    set.forEach(function(value) {
      result[++index] = value;
    });
    return result;
  }
  _setToArray = setToArray;
  return _setToArray;
}
var _equalByTag;
var hasRequired_equalByTag;
function require_equalByTag() {
  if (hasRequired_equalByTag) return _equalByTag;
  hasRequired_equalByTag = 1;
  var Symbol2 = require_Symbol(), Uint8Array = require_Uint8Array(), eq = requireEq(), equalArrays = require_equalArrays(), mapToArray = require_mapToArray(), setToArray = require_setToArray();
  var COMPARE_PARTIAL_FLAG = 1, COMPARE_UNORDERED_FLAG = 2;
  var boolTag = "[object Boolean]", dateTag = "[object Date]", errorTag = "[object Error]", mapTag = "[object Map]", numberTag = "[object Number]", regexpTag = "[object RegExp]", setTag = "[object Set]", stringTag = "[object String]", symbolTag = "[object Symbol]";
  var arrayBufferTag = "[object ArrayBuffer]", dataViewTag = "[object DataView]";
  var symbolProto = Symbol2 ? Symbol2.prototype : void 0, symbolValueOf = symbolProto ? symbolProto.valueOf : void 0;
  function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
    switch (tag) {
      case dataViewTag:
        if (object.byteLength != other.byteLength || object.byteOffset != other.byteOffset) {
          return false;
        }
        object = object.buffer;
        other = other.buffer;
      case arrayBufferTag:
        if (object.byteLength != other.byteLength || !equalFunc(new Uint8Array(object), new Uint8Array(other))) {
          return false;
        }
        return true;
      case boolTag:
      case dateTag:
      case numberTag:
        return eq(+object, +other);
      case errorTag:
        return object.name == other.name && object.message == other.message;
      case regexpTag:
      case stringTag:
        return object == other + "";
      case mapTag:
        var convert = mapToArray;
      case setTag:
        var isPartial = bitmask & COMPARE_PARTIAL_FLAG;
        convert || (convert = setToArray);
        if (object.size != other.size && !isPartial) {
          return false;
        }
        var stacked = stack.get(object);
        if (stacked) {
          return stacked == other;
        }
        bitmask |= COMPARE_UNORDERED_FLAG;
        stack.set(object, other);
        var result = equalArrays(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
        stack["delete"](object);
        return result;
      case symbolTag:
        if (symbolValueOf) {
          return symbolValueOf.call(object) == symbolValueOf.call(other);
        }
    }
    return false;
  }
  _equalByTag = equalByTag;
  return _equalByTag;
}
var _arrayPush;
var hasRequired_arrayPush;
function require_arrayPush() {
  if (hasRequired_arrayPush) return _arrayPush;
  hasRequired_arrayPush = 1;
  function arrayPush(array, values) {
    var index = -1, length = values.length, offset = array.length;
    while (++index < length) {
      array[offset + index] = values[index];
    }
    return array;
  }
  _arrayPush = arrayPush;
  return _arrayPush;
}
var isArray_1;
var hasRequiredIsArray;
function requireIsArray() {
  if (hasRequiredIsArray) return isArray_1;
  hasRequiredIsArray = 1;
  var isArray = Array.isArray;
  isArray_1 = isArray;
  return isArray_1;
}
var _baseGetAllKeys;
var hasRequired_baseGetAllKeys;
function require_baseGetAllKeys() {
  if (hasRequired_baseGetAllKeys) return _baseGetAllKeys;
  hasRequired_baseGetAllKeys = 1;
  var arrayPush = require_arrayPush(), isArray = requireIsArray();
  function baseGetAllKeys(object, keysFunc, symbolsFunc) {
    var result = keysFunc(object);
    return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
  }
  _baseGetAllKeys = baseGetAllKeys;
  return _baseGetAllKeys;
}
var _arrayFilter;
var hasRequired_arrayFilter;
function require_arrayFilter() {
  if (hasRequired_arrayFilter) return _arrayFilter;
  hasRequired_arrayFilter = 1;
  function arrayFilter(array, predicate) {
    var index = -1, length = array == null ? 0 : array.length, resIndex = 0, result = [];
    while (++index < length) {
      var value = array[index];
      if (predicate(value, index, array)) {
        result[resIndex++] = value;
      }
    }
    return result;
  }
  _arrayFilter = arrayFilter;
  return _arrayFilter;
}
var stubArray_1;
var hasRequiredStubArray;
function requireStubArray() {
  if (hasRequiredStubArray) return stubArray_1;
  hasRequiredStubArray = 1;
  function stubArray() {
    return [];
  }
  stubArray_1 = stubArray;
  return stubArray_1;
}
var _getSymbols;
var hasRequired_getSymbols;
function require_getSymbols() {
  if (hasRequired_getSymbols) return _getSymbols;
  hasRequired_getSymbols = 1;
  var arrayFilter = require_arrayFilter(), stubArray = requireStubArray();
  var objectProto = Object.prototype;
  var propertyIsEnumerable = objectProto.propertyIsEnumerable;
  var nativeGetSymbols = Object.getOwnPropertySymbols;
  var getSymbols = !nativeGetSymbols ? stubArray : function(object) {
    if (object == null) {
      return [];
    }
    object = Object(object);
    return arrayFilter(nativeGetSymbols(object), function(symbol) {
      return propertyIsEnumerable.call(object, symbol);
    });
  };
  _getSymbols = getSymbols;
  return _getSymbols;
}
var _baseTimes;
var hasRequired_baseTimes;
function require_baseTimes() {
  if (hasRequired_baseTimes) return _baseTimes;
  hasRequired_baseTimes = 1;
  function baseTimes(n, iteratee) {
    var index = -1, result = Array(n);
    while (++index < n) {
      result[index] = iteratee(index);
    }
    return result;
  }
  _baseTimes = baseTimes;
  return _baseTimes;
}
var _baseIsArguments;
var hasRequired_baseIsArguments;
function require_baseIsArguments() {
  if (hasRequired_baseIsArguments) return _baseIsArguments;
  hasRequired_baseIsArguments = 1;
  var baseGetTag = require_baseGetTag(), isObjectLike = requireIsObjectLike();
  var argsTag = "[object Arguments]";
  function baseIsArguments(value) {
    return isObjectLike(value) && baseGetTag(value) == argsTag;
  }
  _baseIsArguments = baseIsArguments;
  return _baseIsArguments;
}
var isArguments_1;
var hasRequiredIsArguments;
function requireIsArguments() {
  if (hasRequiredIsArguments) return isArguments_1;
  hasRequiredIsArguments = 1;
  var baseIsArguments = require_baseIsArguments(), isObjectLike = requireIsObjectLike();
  var objectProto = Object.prototype;
  var hasOwnProperty = objectProto.hasOwnProperty;
  var propertyIsEnumerable = objectProto.propertyIsEnumerable;
  var isArguments = baseIsArguments(/* @__PURE__ */ (function() {
    return arguments;
  })()) ? baseIsArguments : function(value) {
    return isObjectLike(value) && hasOwnProperty.call(value, "callee") && !propertyIsEnumerable.call(value, "callee");
  };
  isArguments_1 = isArguments;
  return isArguments_1;
}
var isBuffer = { exports: {} };
var stubFalse_1;
var hasRequiredStubFalse;
function requireStubFalse() {
  if (hasRequiredStubFalse) return stubFalse_1;
  hasRequiredStubFalse = 1;
  function stubFalse() {
    return false;
  }
  stubFalse_1 = stubFalse;
  return stubFalse_1;
}
isBuffer.exports;
var hasRequiredIsBuffer;
function requireIsBuffer() {
  if (hasRequiredIsBuffer) return isBuffer.exports;
  hasRequiredIsBuffer = 1;
  (function(module, exports) {
    var root = require_root(), stubFalse = requireStubFalse();
    var freeExports = exports && !exports.nodeType && exports;
    var freeModule = freeExports && true && module && !module.nodeType && module;
    var moduleExports = freeModule && freeModule.exports === freeExports;
    var Buffer = moduleExports ? root.Buffer : void 0;
    var nativeIsBuffer = Buffer ? Buffer.isBuffer : void 0;
    var isBuffer2 = nativeIsBuffer || stubFalse;
    module.exports = isBuffer2;
  })(isBuffer, isBuffer.exports);
  return isBuffer.exports;
}
var _isIndex;
var hasRequired_isIndex;
function require_isIndex() {
  if (hasRequired_isIndex) return _isIndex;
  hasRequired_isIndex = 1;
  var MAX_SAFE_INTEGER = 9007199254740991;
  var reIsUint = /^(?:0|[1-9]\d*)$/;
  function isIndex(value, length) {
    var type = typeof value;
    length = length == null ? MAX_SAFE_INTEGER : length;
    return !!length && (type == "number" || type != "symbol" && reIsUint.test(value)) && (value > -1 && value % 1 == 0 && value < length);
  }
  _isIndex = isIndex;
  return _isIndex;
}
var isLength_1;
var hasRequiredIsLength;
function requireIsLength() {
  if (hasRequiredIsLength) return isLength_1;
  hasRequiredIsLength = 1;
  var MAX_SAFE_INTEGER = 9007199254740991;
  function isLength(value) {
    return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
  }
  isLength_1 = isLength;
  return isLength_1;
}
var _baseIsTypedArray;
var hasRequired_baseIsTypedArray;
function require_baseIsTypedArray() {
  if (hasRequired_baseIsTypedArray) return _baseIsTypedArray;
  hasRequired_baseIsTypedArray = 1;
  var baseGetTag = require_baseGetTag(), isLength = requireIsLength(), isObjectLike = requireIsObjectLike();
  var argsTag = "[object Arguments]", arrayTag = "[object Array]", boolTag = "[object Boolean]", dateTag = "[object Date]", errorTag = "[object Error]", funcTag = "[object Function]", mapTag = "[object Map]", numberTag = "[object Number]", objectTag = "[object Object]", regexpTag = "[object RegExp]", setTag = "[object Set]", stringTag = "[object String]", weakMapTag = "[object WeakMap]";
  var arrayBufferTag = "[object ArrayBuffer]", dataViewTag = "[object DataView]", float32Tag = "[object Float32Array]", float64Tag = "[object Float64Array]", int8Tag = "[object Int8Array]", int16Tag = "[object Int16Array]", int32Tag = "[object Int32Array]", uint8Tag = "[object Uint8Array]", uint8ClampedTag = "[object Uint8ClampedArray]", uint16Tag = "[object Uint16Array]", uint32Tag = "[object Uint32Array]";
  var typedArrayTags = {};
  typedArrayTags[float32Tag] = typedArrayTags[float64Tag] = typedArrayTags[int8Tag] = typedArrayTags[int16Tag] = typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] = typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] = typedArrayTags[uint32Tag] = true;
  typedArrayTags[argsTag] = typedArrayTags[arrayTag] = typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] = typedArrayTags[dataViewTag] = typedArrayTags[dateTag] = typedArrayTags[errorTag] = typedArrayTags[funcTag] = typedArrayTags[mapTag] = typedArrayTags[numberTag] = typedArrayTags[objectTag] = typedArrayTags[regexpTag] = typedArrayTags[setTag] = typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;
  function baseIsTypedArray(value) {
    return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
  }
  _baseIsTypedArray = baseIsTypedArray;
  return _baseIsTypedArray;
}
var _baseUnary;
var hasRequired_baseUnary;
function require_baseUnary() {
  if (hasRequired_baseUnary) return _baseUnary;
  hasRequired_baseUnary = 1;
  function baseUnary(func) {
    return function(value) {
      return func(value);
    };
  }
  _baseUnary = baseUnary;
  return _baseUnary;
}
var _nodeUtil = { exports: {} };
_nodeUtil.exports;
var hasRequired_nodeUtil;
function require_nodeUtil() {
  if (hasRequired_nodeUtil) return _nodeUtil.exports;
  hasRequired_nodeUtil = 1;
  (function(module, exports) {
    var freeGlobal = require_freeGlobal();
    var freeExports = exports && !exports.nodeType && exports;
    var freeModule = freeExports && true && module && !module.nodeType && module;
    var moduleExports = freeModule && freeModule.exports === freeExports;
    var freeProcess = moduleExports && freeGlobal.process;
    var nodeUtil = (function() {
      try {
        var types = freeModule && freeModule.require && freeModule.require("util").types;
        if (types) {
          return types;
        }
        return freeProcess && freeProcess.binding && freeProcess.binding("util");
      } catch (e) {
      }
    })();
    module.exports = nodeUtil;
  })(_nodeUtil, _nodeUtil.exports);
  return _nodeUtil.exports;
}
var isTypedArray_1;
var hasRequiredIsTypedArray;
function requireIsTypedArray() {
  if (hasRequiredIsTypedArray) return isTypedArray_1;
  hasRequiredIsTypedArray = 1;
  var baseIsTypedArray = require_baseIsTypedArray(), baseUnary = require_baseUnary(), nodeUtil = require_nodeUtil();
  var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;
  var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;
  isTypedArray_1 = isTypedArray;
  return isTypedArray_1;
}
var _arrayLikeKeys;
var hasRequired_arrayLikeKeys;
function require_arrayLikeKeys() {
  if (hasRequired_arrayLikeKeys) return _arrayLikeKeys;
  hasRequired_arrayLikeKeys = 1;
  var baseTimes = require_baseTimes(), isArguments = requireIsArguments(), isArray = requireIsArray(), isBuffer2 = requireIsBuffer(), isIndex = require_isIndex(), isTypedArray = requireIsTypedArray();
  var objectProto = Object.prototype;
  var hasOwnProperty = objectProto.hasOwnProperty;
  function arrayLikeKeys(value, inherited) {
    var isArr = isArray(value), isArg = !isArr && isArguments(value), isBuff = !isArr && !isArg && isBuffer2(value), isType = !isArr && !isArg && !isBuff && isTypedArray(value), skipIndexes = isArr || isArg || isBuff || isType, result = skipIndexes ? baseTimes(value.length, String) : [], length = result.length;
    for (var key in value) {
      if ((inherited || hasOwnProperty.call(value, key)) && !(skipIndexes && // Safari 9 has enumerable `arguments.length` in strict mode.
      (key == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
      isBuff && (key == "offset" || key == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
      isType && (key == "buffer" || key == "byteLength" || key == "byteOffset") || // Skip index properties.
      isIndex(key, length)))) {
        result.push(key);
      }
    }
    return result;
  }
  _arrayLikeKeys = arrayLikeKeys;
  return _arrayLikeKeys;
}
var _isPrototype;
var hasRequired_isPrototype;
function require_isPrototype() {
  if (hasRequired_isPrototype) return _isPrototype;
  hasRequired_isPrototype = 1;
  var objectProto = Object.prototype;
  function isPrototype(value) {
    var Ctor = value && value.constructor, proto = typeof Ctor == "function" && Ctor.prototype || objectProto;
    return value === proto;
  }
  _isPrototype = isPrototype;
  return _isPrototype;
}
var _overArg;
var hasRequired_overArg;
function require_overArg() {
  if (hasRequired_overArg) return _overArg;
  hasRequired_overArg = 1;
  function overArg(func, transform) {
    return function(arg) {
      return func(transform(arg));
    };
  }
  _overArg = overArg;
  return _overArg;
}
var _nativeKeys;
var hasRequired_nativeKeys;
function require_nativeKeys() {
  if (hasRequired_nativeKeys) return _nativeKeys;
  hasRequired_nativeKeys = 1;
  var overArg = require_overArg();
  var nativeKeys = overArg(Object.keys, Object);
  _nativeKeys = nativeKeys;
  return _nativeKeys;
}
var _baseKeys;
var hasRequired_baseKeys;
function require_baseKeys() {
  if (hasRequired_baseKeys) return _baseKeys;
  hasRequired_baseKeys = 1;
  var isPrototype = require_isPrototype(), nativeKeys = require_nativeKeys();
  var objectProto = Object.prototype;
  var hasOwnProperty = objectProto.hasOwnProperty;
  function baseKeys(object) {
    if (!isPrototype(object)) {
      return nativeKeys(object);
    }
    var result = [];
    for (var key in Object(object)) {
      if (hasOwnProperty.call(object, key) && key != "constructor") {
        result.push(key);
      }
    }
    return result;
  }
  _baseKeys = baseKeys;
  return _baseKeys;
}
var isArrayLike_1;
var hasRequiredIsArrayLike;
function requireIsArrayLike() {
  if (hasRequiredIsArrayLike) return isArrayLike_1;
  hasRequiredIsArrayLike = 1;
  var isFunction = requireIsFunction(), isLength = requireIsLength();
  function isArrayLike(value) {
    return value != null && isLength(value.length) && !isFunction(value);
  }
  isArrayLike_1 = isArrayLike;
  return isArrayLike_1;
}
var keys_1;
var hasRequiredKeys;
function requireKeys() {
  if (hasRequiredKeys) return keys_1;
  hasRequiredKeys = 1;
  var arrayLikeKeys = require_arrayLikeKeys(), baseKeys = require_baseKeys(), isArrayLike = requireIsArrayLike();
  function keys(object) {
    return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
  }
  keys_1 = keys;
  return keys_1;
}
var _getAllKeys;
var hasRequired_getAllKeys;
function require_getAllKeys() {
  if (hasRequired_getAllKeys) return _getAllKeys;
  hasRequired_getAllKeys = 1;
  var baseGetAllKeys = require_baseGetAllKeys(), getSymbols = require_getSymbols(), keys = requireKeys();
  function getAllKeys(object) {
    return baseGetAllKeys(object, keys, getSymbols);
  }
  _getAllKeys = getAllKeys;
  return _getAllKeys;
}
var _equalObjects;
var hasRequired_equalObjects;
function require_equalObjects() {
  if (hasRequired_equalObjects) return _equalObjects;
  hasRequired_equalObjects = 1;
  var getAllKeys = require_getAllKeys();
  var COMPARE_PARTIAL_FLAG = 1;
  var objectProto = Object.prototype;
  var hasOwnProperty = objectProto.hasOwnProperty;
  function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
    var isPartial = bitmask & COMPARE_PARTIAL_FLAG, objProps = getAllKeys(object), objLength = objProps.length, othProps = getAllKeys(other), othLength = othProps.length;
    if (objLength != othLength && !isPartial) {
      return false;
    }
    var index = objLength;
    while (index--) {
      var key = objProps[index];
      if (!(isPartial ? key in other : hasOwnProperty.call(other, key))) {
        return false;
      }
    }
    var objStacked = stack.get(object);
    var othStacked = stack.get(other);
    if (objStacked && othStacked) {
      return objStacked == other && othStacked == object;
    }
    var result = true;
    stack.set(object, other);
    stack.set(other, object);
    var skipCtor = isPartial;
    while (++index < objLength) {
      key = objProps[index];
      var objValue = object[key], othValue = other[key];
      if (customizer) {
        var compared = isPartial ? customizer(othValue, objValue, key, other, object, stack) : customizer(objValue, othValue, key, object, other, stack);
      }
      if (!(compared === void 0 ? objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack) : compared)) {
        result = false;
        break;
      }
      skipCtor || (skipCtor = key == "constructor");
    }
    if (result && !skipCtor) {
      var objCtor = object.constructor, othCtor = other.constructor;
      if (objCtor != othCtor && ("constructor" in object && "constructor" in other) && !(typeof objCtor == "function" && objCtor instanceof objCtor && typeof othCtor == "function" && othCtor instanceof othCtor)) {
        result = false;
      }
    }
    stack["delete"](object);
    stack["delete"](other);
    return result;
  }
  _equalObjects = equalObjects;
  return _equalObjects;
}
var _DataView;
var hasRequired_DataView;
function require_DataView() {
  if (hasRequired_DataView) return _DataView;
  hasRequired_DataView = 1;
  var getNative = require_getNative(), root = require_root();
  var DataView = getNative(root, "DataView");
  _DataView = DataView;
  return _DataView;
}
var _Promise;
var hasRequired_Promise;
function require_Promise() {
  if (hasRequired_Promise) return _Promise;
  hasRequired_Promise = 1;
  var getNative = require_getNative(), root = require_root();
  var Promise2 = getNative(root, "Promise");
  _Promise = Promise2;
  return _Promise;
}
var _Set;
var hasRequired_Set;
function require_Set() {
  if (hasRequired_Set) return _Set;
  hasRequired_Set = 1;
  var getNative = require_getNative(), root = require_root();
  var Set2 = getNative(root, "Set");
  _Set = Set2;
  return _Set;
}
var _WeakMap;
var hasRequired_WeakMap;
function require_WeakMap() {
  if (hasRequired_WeakMap) return _WeakMap;
  hasRequired_WeakMap = 1;
  var getNative = require_getNative(), root = require_root();
  var WeakMap = getNative(root, "WeakMap");
  _WeakMap = WeakMap;
  return _WeakMap;
}
var _getTag;
var hasRequired_getTag;
function require_getTag() {
  if (hasRequired_getTag) return _getTag;
  hasRequired_getTag = 1;
  var DataView = require_DataView(), Map2 = require_Map(), Promise2 = require_Promise(), Set2 = require_Set(), WeakMap = require_WeakMap(), baseGetTag = require_baseGetTag(), toSource = require_toSource();
  var mapTag = "[object Map]", objectTag = "[object Object]", promiseTag = "[object Promise]", setTag = "[object Set]", weakMapTag = "[object WeakMap]";
  var dataViewTag = "[object DataView]";
  var dataViewCtorString = toSource(DataView), mapCtorString = toSource(Map2), promiseCtorString = toSource(Promise2), setCtorString = toSource(Set2), weakMapCtorString = toSource(WeakMap);
  var getTag = baseGetTag;
  if (DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag || Map2 && getTag(new Map2()) != mapTag || Promise2 && getTag(Promise2.resolve()) != promiseTag || Set2 && getTag(new Set2()) != setTag || WeakMap && getTag(new WeakMap()) != weakMapTag) {
    getTag = function(value) {
      var result = baseGetTag(value), Ctor = result == objectTag ? value.constructor : void 0, ctorString = Ctor ? toSource(Ctor) : "";
      if (ctorString) {
        switch (ctorString) {
          case dataViewCtorString:
            return dataViewTag;
          case mapCtorString:
            return mapTag;
          case promiseCtorString:
            return promiseTag;
          case setCtorString:
            return setTag;
          case weakMapCtorString:
            return weakMapTag;
        }
      }
      return result;
    };
  }
  _getTag = getTag;
  return _getTag;
}
var _baseIsEqualDeep;
var hasRequired_baseIsEqualDeep;
function require_baseIsEqualDeep() {
  if (hasRequired_baseIsEqualDeep) return _baseIsEqualDeep;
  hasRequired_baseIsEqualDeep = 1;
  var Stack = require_Stack(), equalArrays = require_equalArrays(), equalByTag = require_equalByTag(), equalObjects = require_equalObjects(), getTag = require_getTag(), isArray = requireIsArray(), isBuffer2 = requireIsBuffer(), isTypedArray = requireIsTypedArray();
  var COMPARE_PARTIAL_FLAG = 1;
  var argsTag = "[object Arguments]", arrayTag = "[object Array]", objectTag = "[object Object]";
  var objectProto = Object.prototype;
  var hasOwnProperty = objectProto.hasOwnProperty;
  function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
    var objIsArr = isArray(object), othIsArr = isArray(other), objTag = objIsArr ? arrayTag : getTag(object), othTag = othIsArr ? arrayTag : getTag(other);
    objTag = objTag == argsTag ? objectTag : objTag;
    othTag = othTag == argsTag ? objectTag : othTag;
    var objIsObj = objTag == objectTag, othIsObj = othTag == objectTag, isSameTag = objTag == othTag;
    if (isSameTag && isBuffer2(object)) {
      if (!isBuffer2(other)) {
        return false;
      }
      objIsArr = true;
      objIsObj = false;
    }
    if (isSameTag && !objIsObj) {
      stack || (stack = new Stack());
      return objIsArr || isTypedArray(object) ? equalArrays(object, other, bitmask, customizer, equalFunc, stack) : equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
    }
    if (!(bitmask & COMPARE_PARTIAL_FLAG)) {
      var objIsWrapped = objIsObj && hasOwnProperty.call(object, "__wrapped__"), othIsWrapped = othIsObj && hasOwnProperty.call(other, "__wrapped__");
      if (objIsWrapped || othIsWrapped) {
        var objUnwrapped = objIsWrapped ? object.value() : object, othUnwrapped = othIsWrapped ? other.value() : other;
        stack || (stack = new Stack());
        return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
      }
    }
    if (!isSameTag) {
      return false;
    }
    stack || (stack = new Stack());
    return equalObjects(object, other, bitmask, customizer, equalFunc, stack);
  }
  _baseIsEqualDeep = baseIsEqualDeep;
  return _baseIsEqualDeep;
}
var _baseIsEqual;
var hasRequired_baseIsEqual;
function require_baseIsEqual() {
  if (hasRequired_baseIsEqual) return _baseIsEqual;
  hasRequired_baseIsEqual = 1;
  var baseIsEqualDeep = require_baseIsEqualDeep(), isObjectLike = requireIsObjectLike();
  function baseIsEqual(value, other, bitmask, customizer, stack) {
    if (value === other) {
      return true;
    }
    if (value == null || other == null || !isObjectLike(value) && !isObjectLike(other)) {
      return value !== value && other !== other;
    }
    return baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
  }
  _baseIsEqual = baseIsEqual;
  return _baseIsEqual;
}
var isEqual_1;
var hasRequiredIsEqual;
function requireIsEqual() {
  if (hasRequiredIsEqual) return isEqual_1;
  hasRequiredIsEqual = 1;
  var baseIsEqual = require_baseIsEqual();
  function isEqual2(value, other) {
    return baseIsEqual(value, other);
  }
  isEqual_1 = isEqual2;
  return isEqual_1;
}
var isEqualExports = requireIsEqual();
const isEqual = /* @__PURE__ */ getDefaultExportFromCjs(isEqualExports);
const FRAME_WIDTH = 136;
const FRAME_HEIGHT = 136;
const OFFSET_TOP = 57;
const OFFSET_LEFT = 7;
const getDistance = (x1, y1, x2, y2) => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};
const useBezier = ({
  dragstartCallback,
  dragendCallback
}) => {
  const cubicBezierValue = ref([0, 0, 1, 1]);
  const positions = ref({
    beginX: 0,
    beginY: 0,
    endX: 0,
    endY: 0
  });
  const currentPositions = ref({
    beginX: 0,
    beginY: 0,
    endX: 0,
    endY: 0
  });
  const dragItemType = ref(null);
  const dragStartPosition = ref(null);
  const lastMoveAmount = ref([0, 0]);
  const initBezier = (value) => {
    cubicBezierValue.value = [...value];
    setPositions(value);
  };
  const setPositions = (value) => {
    const [beginX, beginY, endX, endY] = value;
    positions.value = {
      beginX: FRAME_WIDTH * beginX,
      beginY: FRAME_HEIGHT - FRAME_HEIGHT * beginY,
      endX: FRAME_WIDTH * endX,
      endY: FRAME_HEIGHT - FRAME_HEIGHT * endY
    };
  };
  const getAbsolutePoints = (points) => {
    return points.map((point, index) => {
      return index % 2 === 0 ? point + OFFSET_LEFT : point + OFFSET_TOP;
    });
  };
  const linearLinePoints = computed(() => {
    return getAbsolutePoints([0, FRAME_HEIGHT, FRAME_WIDTH, 0]);
  });
  const beginPoints = computed(() => {
    return getAbsolutePoints([
      0,
      FRAME_HEIGHT,
      positions.value.beginX,
      positions.value.beginY
    ]);
  });
  const endPoints = computed(() => {
    return getAbsolutePoints([
      FRAME_WIDTH,
      0,
      positions.value.endX,
      positions.value.endY
    ]);
  });
  const cubicBezierPathData = computed(() => {
    const [x1, y1, x2, y2] = beginPoints.value;
    const [x3, y3, x4, y4] = endPoints.value;
    return `M${x1} ${y1} C ${x2} ${y2}, ${x4} ${y4}, ${x3} ${y3}`;
  });
  const setCubicBezierValue = () => {
    const { beginX, beginY, endX, endY } = positions.value;
    const formatNumber = (number) => Number(number.toFixed(2));
    const nextCubicBezierValue = [
      beginX / FRAME_WIDTH,
      (FRAME_HEIGHT - beginY) / FRAME_HEIGHT,
      endX / FRAME_WIDTH,
      (FRAME_HEIGHT - endY) / FRAME_HEIGHT
    ].map(formatNumber);
    cubicBezierValue.value = nextCubicBezierValue;
  };
  const dragstart = (e) => {
    const [startX, startY] = [e.offsetX - OFFSET_LEFT, e.offsetY - OFFSET_TOP];
    const { beginX, beginY, endX, endY } = positions.value;
    const distanceToBegin = getDistance(startX, startY, beginX, beginY);
    const distanceToEnd = getDistance(startX, startY, endX, endY);
    dragStartPosition.value = [e.pageX, e.pageY];
    dragItemType.value = distanceToBegin < distanceToEnd ? "begin" : "end";
    if (dragItemType.value === "begin") {
      currentPositions.value = {
        ...positions.value,
        beginX: clamp(startX, 0, FRAME_WIDTH),
        beginY: startY
      };
    } else {
      currentPositions.value = {
        ...positions.value,
        endX: clamp(startX, 0, FRAME_WIDTH),
        endY: startY
      };
    }
    dragstartCallback();
    positions.value = { ...currentPositions.value };
    setCubicBezierValue();
  };
  const onDrag = (e) => {
    if (!dragStartPosition.value) return;
    const [startX, startY] = dragStartPosition.value;
    const moveAmount = [startX - e.pageX, startY - e.pageY].map(
      (value) => ~value
    );
    if (isEqual(lastMoveAmount.value, moveAmount)) return;
    const [moveX, moveY] = moveAmount;
    const { beginX, beginY, endX, endY } = currentPositions.value;
    if (dragItemType.value === "begin") {
      positions.value = {
        ...currentPositions.value,
        beginX: clamp(beginX + moveX, 0, FRAME_WIDTH),
        beginY: beginY + moveY
      };
    } else {
      positions.value = {
        ...currentPositions.value,
        endX: clamp(endX + moveX, 0, FRAME_WIDTH),
        endY: endY + moveY
      };
    }
    lastMoveAmount.value = moveAmount;
    setCubicBezierValue();
  };
  const dragend = () => {
    if (dragItemType.value) {
      dragendCallback();
    }
    dragItemType.value = null;
    dragStartPosition.value = null;
  };
  return {
    cubicBezierValue,
    initBezier,
    setPositions,
    linearLinePoints,
    beginPoints,
    endPoints,
    cubicBezierPathData,
    dragstart,
    onDrag,
    dragend
  };
};
var _baseRange;
var hasRequired_baseRange;
function require_baseRange() {
  if (hasRequired_baseRange) return _baseRange;
  hasRequired_baseRange = 1;
  var nativeCeil = Math.ceil, nativeMax = Math.max;
  function baseRange(start, end, step, fromRight) {
    var index = -1, length = nativeMax(nativeCeil((end - start) / (step || 1)), 0), result = Array(length);
    while (length--) {
      result[fromRight ? length : ++index] = start;
      start += step;
    }
    return result;
  }
  _baseRange = baseRange;
  return _baseRange;
}
var _isIterateeCall;
var hasRequired_isIterateeCall;
function require_isIterateeCall() {
  if (hasRequired_isIterateeCall) return _isIterateeCall;
  hasRequired_isIterateeCall = 1;
  var eq = requireEq(), isArrayLike = requireIsArrayLike(), isIndex = require_isIndex(), isObject = requireIsObject();
  function isIterateeCall(value, index, object) {
    if (!isObject(object)) {
      return false;
    }
    var type = typeof index;
    if (type == "number" ? isArrayLike(object) && isIndex(index, object.length) : type == "string" && index in object) {
      return eq(object[index], value);
    }
    return false;
  }
  _isIterateeCall = isIterateeCall;
  return _isIterateeCall;
}
var toFinite_1;
var hasRequiredToFinite;
function requireToFinite() {
  if (hasRequiredToFinite) return toFinite_1;
  hasRequiredToFinite = 1;
  var toNumber = requireToNumber();
  var INFINITY = 1 / 0, MAX_INTEGER = 17976931348623157e292;
  function toFinite(value) {
    if (!value) {
      return value === 0 ? value : 0;
    }
    value = toNumber(value);
    if (value === INFINITY || value === -INFINITY) {
      var sign = value < 0 ? -1 : 1;
      return sign * MAX_INTEGER;
    }
    return value === value ? value : 0;
  }
  toFinite_1 = toFinite;
  return toFinite_1;
}
var _createRange;
var hasRequired_createRange;
function require_createRange() {
  if (hasRequired_createRange) return _createRange;
  hasRequired_createRange = 1;
  var baseRange = require_baseRange(), isIterateeCall = require_isIterateeCall(), toFinite = requireToFinite();
  function createRange(fromRight) {
    return function(start, end, step) {
      if (step && typeof step != "number" && isIterateeCall(start, end, step)) {
        end = step = void 0;
      }
      start = toFinite(start);
      if (end === void 0) {
        end = start;
        start = 0;
      } else {
        end = toFinite(end);
      }
      step = step === void 0 ? start < end ? 1 : -1 : toFinite(step);
      return baseRange(start, end, step, fromRight);
    };
  }
  _createRange = createRange;
  return _createRange;
}
var range_1;
var hasRequiredRange;
function requireRange() {
  if (hasRequiredRange) return range_1;
  hasRequiredRange = 1;
  var createRange = require_createRange();
  var range2 = createRange();
  range_1 = range2;
  return range_1;
}
var rangeExports = requireRange();
const range = /* @__PURE__ */ getDefaultExportFromCjs(rangeExports);
var NEWTON_ITERATIONS = 4;
var NEWTON_MIN_SLOPE = 1e-3;
var SUBDIVISION_PRECISION = 1e-7;
var SUBDIVISION_MAX_ITERATIONS = 10;
var kSplineTableSize = 11;
var kSampleStepSize = 1 / (kSplineTableSize - 1);
var float32ArraySupported = typeof Float32Array === "function";
function A(aA1, aA2) {
  return 1 - 3 * aA2 + 3 * aA1;
}
function B(aA1, aA2) {
  return 3 * aA2 - 6 * aA1;
}
function C(aA1) {
  return 3 * aA1;
}
function calcBezier(aT, aA1, aA2) {
  return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT;
}
function getSlope(aT, aA1, aA2) {
  return 3 * A(aA1, aA2) * aT * aT + 2 * B(aA1, aA2) * aT + C(aA1);
}
function binarySubdivide(aX, aA, aB, mX1, mX2) {
  var currentX, currentT, i = 0;
  do {
    currentT = aA + (aB - aA) / 2;
    currentX = calcBezier(currentT, mX1, mX2) - aX;
    if (currentX > 0) {
      aB = currentT;
    } else {
      aA = currentT;
    }
  } while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);
  return currentT;
}
function newtonRaphsonIterate(aX, aGuessT, mX1, mX2) {
  for (var i = 0; i < NEWTON_ITERATIONS; ++i) {
    var currentSlope = getSlope(aGuessT, mX1, mX2);
    if (currentSlope === 0) {
      return aGuessT;
    }
    var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
    aGuessT -= currentX / currentSlope;
  }
  return aGuessT;
}
function LinearEasing(x) {
  return x;
}
function bezier(mX1, mY1, mX2, mY2) {
  if (!(0 <= mX1 && mX1 <= 1 && 0 <= mX2 && mX2 <= 1)) {
    throw new Error("bezier x values must be in [0, 1] range");
  }
  if (mX1 === mY1 && mX2 === mY2) {
    return LinearEasing;
  }
  var sampleValues = float32ArraySupported ? new Float32Array(kSplineTableSize) : new Array(kSplineTableSize);
  for (var i = 0; i < kSplineTableSize; ++i) {
    sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
  }
  function getTForX(aX) {
    var intervalStart = 0;
    var currentSample = 1;
    var lastSample = kSplineTableSize - 1;
    for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
      intervalStart += kSampleStepSize;
    }
    --currentSample;
    var dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
    var guessForT = intervalStart + dist * kSampleStepSize;
    var initialSlope = getSlope(guessForT, mX1, mX2);
    if (initialSlope >= NEWTON_MIN_SLOPE) {
      return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
    } else if (initialSlope === 0) {
      return guessForT;
    } else {
      return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize, mX1, mX2);
    }
  }
  return function BezierEasing(x) {
    if (x === 0 || x === 1) {
      return x;
    }
    return calcBezier(getTForX(x), mY1, mY2);
  };
}
const PREVIEW_TRACE_COUNT = 20;
const PREVIEW_MOVE_DURATION = 1400;
const PREVIEW_FADE_OUT_DURATION = 100;
const PREVIEW_TOTAL_DURATION = PREVIEW_MOVE_DURATION + PREVIEW_FADE_OUT_DURATION;
const usePreview = (cubicBezierValue) => {
  const previewAreaWidth = 218;
  const previewCubicBezierValue = ref([0, 0, 1, 1]);
  const previewEasing = ref(bezier(0, 0, 1, 1));
  const bezierPreviewElement = ref(null);
  const animatonTracePositions = ref(null);
  const previewAnimation = ref(null);
  const previewIsRunning = ref(false);
  const startTime = ref(0);
  const endTime = ref(0);
  const triggerPreview = () => {
    if (previewAnimation.value) {
      cancelAnimationFrame(previewAnimation.value);
    }
    previewCubicBezierValue.value = [...cubicBezierValue.value];
    previewEasing.value = bezier(
      cubicBezierValue.value[0],
      cubicBezierValue.value[1],
      cubicBezierValue.value[2],
      cubicBezierValue.value[3]
    );
    previewIsRunning.value = true;
    setPreviewTraces();
    requestAnimationFrame(runPreview);
  };
  const setPreviewTraces = () => {
    const easing = bezier(
      cubicBezierValue.value[0],
      cubicBezierValue.value[1],
      cubicBezierValue.value[2],
      cubicBezierValue.value[3]
    );
    const keyFrames = range(PREVIEW_TRACE_COUNT + 1).map((index) => {
      const currentTime = index / PREVIEW_TRACE_COUNT;
      return easing(currentTime);
    });
    animatonTracePositions.value = keyFrames;
  };
  const runPreview = (timeStamp) => {
    if (!bezierPreviewElement.value) {
      return;
    }
    startTime.value = timeStamp;
    endTime.value = startTime.value + PREVIEW_TOTAL_DURATION;
    bezierPreviewElement.value.style.opacity = "1";
    drawPreview(timeStamp);
  };
  const drawPreview = (now) => {
    if (!previewIsRunning.value) {
      resetPreview();
      return;
    }
    const elapsedTime = now - startTime.value;
    if (elapsedTime >= PREVIEW_TOTAL_DURATION) {
      previewIsRunning.value = false;
    }
    if (elapsedTime <= PREVIEW_MOVE_DURATION) {
      const moveTimeRatio = elapsedTime / PREVIEW_MOVE_DURATION;
      const position = previewAreaWidth * previewEasing.value(moveTimeRatio);
      if (bezierPreviewElement.value) {
        bezierPreviewElement.value.style.transform = `translateX(${position}px)`;
      }
    }
    if (elapsedTime >= PREVIEW_TOTAL_DURATION - PREVIEW_FADE_OUT_DURATION) {
      const fadeOutTimeRatio = (elapsedTime - PREVIEW_MOVE_DURATION) / PREVIEW_FADE_OUT_DURATION;
      if (bezierPreviewElement.value) {
        bezierPreviewElement.value.style.opacity = `${1 - fadeOutTimeRatio}`;
      }
    }
    previewAnimation.value = requestAnimationFrame(drawPreview);
  };
  const resetPreview = () => {
    if (bezierPreviewElement.value) {
      bezierPreviewElement.value.style.transform = "translateX(0px)";
      bezierPreviewElement.value.style.opacity = "0";
    }
    previewAnimation.value = null;
    return;
  };
  return {
    bezierPreviewElement,
    previewAreaWidth,
    animatonTracePositions,
    triggerPreview
  };
};
const _sfc_main$d = {
  name: "BezierCurve",
  props: [
    "cubicBezierPathData",
    "linearLinePoints",
    "beginPoints",
    "endPoints"
  ]
};
const _hoisted_1$9 = ["x1", "y1", "x2", "y2"];
const _hoisted_2$7 = ["d"];
const _hoisted_3$3 = ["x1", "y1", "x2", "y2"];
const _hoisted_4$2 = ["cx", "cy"];
const _hoisted_5$2 = ["x1", "y1", "x2", "y2"];
const _hoisted_6$2 = ["cx", "cy"];
function _sfc_render$c(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("svg", {
    class: "bezier-curve",
    width: "150",
    height: "250",
    onMousedown: _cache[0] || (_cache[0] = ($event) => _ctx.$emit("drag-start", $event))
  }, [
    createBaseVNode("g", null, [
      createBaseVNode("line", {
        class: "linear-line",
        x1: $props.linearLinePoints[0],
        y1: $props.linearLinePoints[1],
        x2: $props.linearLinePoints[2],
        y2: $props.linearLinePoints[3]
      }, null, 8, _hoisted_1$9),
      createBaseVNode("path", {
        class: "bezier-path",
        d: $props.cubicBezierPathData
      }, null, 8, _hoisted_2$7),
      createBaseVNode("line", {
        class: "bezier-control-line",
        x1: $props.beginPoints[0],
        y1: $props.beginPoints[1],
        x2: $props.beginPoints[2],
        y2: $props.beginPoints[3]
      }, null, 8, _hoisted_3$3),
      createBaseVNode("circle", {
        class: "bezier-control-circle",
        cx: $props.beginPoints[2],
        cy: $props.beginPoints[3],
        r: "7"
      }, null, 8, _hoisted_4$2),
      createBaseVNode("line", {
        class: "bezier-control-line",
        x1: $props.endPoints[0],
        y1: $props.endPoints[1],
        x2: $props.endPoints[2],
        y2: $props.endPoints[3]
      }, null, 8, _hoisted_5$2),
      createBaseVNode("circle", {
        class: "bezier-control-circle",
        cx: $props.endPoints[2],
        cy: $props.endPoints[3],
        r: "7"
      }, null, 8, _hoisted_6$2)
    ])
  ], 32);
}
const BezierCurve = /* @__PURE__ */ _export_sfc(_sfc_main$d, [["render", _sfc_render$c], ["__scopeId", "data-v-0e57ecae"]]);
const _sfc_main$c = {
  name: "BezierPreset",
  props: ["value"],
  data() {
    return {
      cubicBezierPathData: "",
      offset: {
        top: 2,
        left: 2
      },
      frame: {
        width: 36,
        height: 36
      }
    };
  },
  created() {
    this.setPositions(this.value);
    this.setCubicBezierPathData();
  },
  computed: {
    beginPoints() {
      const { height } = this.frame;
      const { beginX, beginY } = this.positions;
      return this.getAbsolutePoints([0, height, beginX, beginY]);
    },
    endPoints() {
      const { width } = this.frame;
      const { endX, endY } = this.positions;
      return this.getAbsolutePoints([width, 0, endX, endY]);
    }
  },
  methods: {
    setPositions(value) {
      const { width, height } = this.frame;
      const [beginX, beginY, endX, endY] = value;
      this.positions = {
        beginX: width * beginX,
        beginY: height - height * beginY,
        endX: width * endX,
        endY: height - height * endY
      };
    },
    setCubicBezierPathData() {
      const [x1, y1, x2, y2] = this.beginPoints;
      const [x3, y3, x4, y4] = this.endPoints;
      this.cubicBezierPathData = `M${x1} ${y1} C ${x2} ${y2}, ${x4} ${y4}, ${x3} ${y3}`;
    },
    getAbsolutePoints(points) {
      return [...points].map((point, index) => {
        return index % 2 === 0 ? point + this.offset.left : point + this.offset.top;
      });
    }
  }
};
const _hoisted_1$8 = {
  class: "bezier-preset",
  width: "40",
  height: "40"
};
const _hoisted_2$6 = ["d"];
const _hoisted_3$2 = ["x1", "y1", "x2", "y2"];
const _hoisted_4$1 = ["cx", "cy"];
const _hoisted_5$1 = ["x1", "y1", "x2", "y2"];
const _hoisted_6$1 = ["cx", "cy"];
function _sfc_render$b(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("svg", _hoisted_1$8, [
    createBaseVNode("g", null, [
      createBaseVNode("path", {
        class: "bezier-path",
        d: $data.cubicBezierPathData
      }, null, 8, _hoisted_2$6),
      createBaseVNode("line", {
        class: "bezier-control-line",
        x1: $options.beginPoints[0],
        y1: $options.beginPoints[1],
        x2: $options.beginPoints[2],
        y2: $options.beginPoints[3]
      }, null, 8, _hoisted_3$2),
      createBaseVNode("circle", {
        class: "bezier-control-circle",
        cx: $options.beginPoints[2],
        cy: $options.beginPoints[3],
        r: "2"
      }, null, 8, _hoisted_4$1),
      createBaseVNode("line", {
        class: "bezier-control-line",
        x1: $options.endPoints[0],
        y1: $options.endPoints[1],
        x2: $options.endPoints[2],
        y2: $options.endPoints[3]
      }, null, 8, _hoisted_5$1),
      createBaseVNode("circle", {
        class: "bezier-control-circle",
        cx: $options.endPoints[2],
        cy: $options.endPoints[3],
        r: "2"
      }, null, 8, _hoisted_6$1)
    ])
  ]);
}
const BezierPreset = /* @__PURE__ */ _export_sfc(_sfc_main$c, [["render", _sfc_render$b], ["__scopeId", "data-v-4c2c87b1"]]);
const _sfc_main$b = {
  name: "BezierPresets",
  props: ["presetTypes", "selectedPresetIndex", "selectedPresetType"],
  components: {
    BezierPreset
  },
  methods: {
    getPresetValue(presetType) {
      return PRESET_LISTS[presetType][this.selectedPresetIndex[presetType]].value;
    }
  }
};
const _hoisted_1$7 = { class: "bezier-presets" };
const _hoisted_2$5 = ["onClick"];
function _sfc_render$a(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_bezier_preset = resolveComponent("bezier-preset");
  return openBlock(), createElementBlock("div", _hoisted_1$7, [
    (openBlock(true), createElementBlock(Fragment, null, renderList($props.presetTypes, (preset, index) => {
      return openBlock(), createElementBlock("div", {
        class: "bezier-preset-category",
        key: index,
        onClick: ($event) => _ctx.$emit("apply-preset", preset)
      }, [
        createVNode(_component_bezier_preset, {
          value: $options.getPresetValue(preset),
          class: normalizeClass({ selected: preset === $props.selectedPresetType })
        }, null, 8, ["value", "class"])
      ], 8, _hoisted_2$5);
    }), 128))
  ]);
}
const BezierPresets = /* @__PURE__ */ _export_sfc(_sfc_main$b, [["render", _sfc_render$a], ["__scopeId", "data-v-9fe9b57b"]]);
const _sfc_main$a = {
  name: "BezierHeader",
  props: ["selectedPresetType", "displayValue"]
};
const _hoisted_1$6 = { class: "bezier-header" };
const _hoisted_2$4 = { class: "source-code bezier-display-value" };
function _sfc_render$9(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("div", _hoisted_1$6, [
    $props.selectedPresetType ? (openBlock(), createElementBlock("svg", {
      key: 0,
      class: "bezier-preset-modify bezier-preset-minus",
      width: "20",
      height: "20",
      onClick: _cache[0] || (_cache[0] = ($event) => _ctx.$emit("change-preset", -1))
    }, [..._cache[2] || (_cache[2] = [
      createBaseVNode("path", { d: "M 12 6 L 8 10 L 12 14" }, null, -1)
    ])])) : createCommentVNode("", true),
    $props.selectedPresetType ? (openBlock(), createElementBlock("svg", {
      key: 1,
      class: "bezier-preset-modify bezier-preset-plus",
      width: "20",
      height: "20",
      onClick: _cache[1] || (_cache[1] = ($event) => _ctx.$emit("change-preset", 1))
    }, [..._cache[3] || (_cache[3] = [
      createBaseVNode("path", { d: "M 8 6 L 12 10 L 8 14" }, null, -1)
    ])])) : createCommentVNode("", true),
    createBaseVNode("span", _hoisted_2$4, toDisplayString($props.displayValue), 1)
  ]);
}
const BezierHeader = /* @__PURE__ */ _export_sfc(_sfc_main$a, [["render", _sfc_render$9], ["__scopeId", "data-v-46fa9ad2"]]);
const _hoisted_1$5 = { class: "easing-editor" };
const _hoisted_2$3 = { class: "bezier-container" };
const _sfc_main$9 = /* @__PURE__ */ defineComponent({
  __name: "EasingEditor",
  props: ["modelValue"],
  emits: ["update:modelValue"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const {
      cubicBezierValue,
      initBezier,
      setPositions,
      linearLinePoints,
      beginPoints,
      endPoints,
      cubicBezierPathData,
      dragstart,
      onDrag,
      dragend
    } = useBezier({
      dragstartCallback: () => {
        resetPreset();
      },
      dragendCallback: () => {
        triggerPreview();
      }
    });
    const {
      presetTypes,
      selectedPresetType,
      selectedPresetIndex,
      applyPreset,
      changePreset,
      resetPreset,
      displayValue
    } = usePresets((presetValue) => {
      cubicBezierValue.value = presetValue;
      setPositions(presetValue);
      triggerPreview();
    }, cubicBezierValue);
    const {
      bezierPreviewElement,
      triggerPreview
    } = usePreview(cubicBezierValue);
    const initialValue = props.modelValue;
    initBezier(initialValue);
    watch(cubicBezierValue, () => {
      emit("update:modelValue", cubicBezierValue.value);
    });
    onMounted(() => {
      window.addEventListener("mousemove", onDrag);
      window.addEventListener("mouseup", dragend);
      bezierPreviewElement.value = document.getElementById("bezier-preview");
      triggerPreview();
    });
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1$5, [
        createBaseVNode("div", _hoisted_2$3, [
          createVNode(BezierPresets, {
            "preset-types": unref(presetTypes),
            selectedPresetIndex: unref(selectedPresetIndex),
            selectedPresetType: unref(selectedPresetType),
            onApplyPreset: unref(applyPreset)
          }, null, 8, ["preset-types", "selectedPresetIndex", "selectedPresetType", "onApplyPreset"]),
          createVNode(BezierCurve, {
            "linear-line-points": unref(linearLinePoints),
            "cubic-bezier-path-data": unref(cubicBezierPathData),
            "begin-points": unref(beginPoints),
            "end-points": unref(endPoints),
            onDragStart: _cache[0] || (_cache[0] = ($event) => unref(dragstart)($event))
          }, null, 8, ["linear-line-points", "cubic-bezier-path-data", "begin-points", "end-points"])
        ]),
        createVNode(BezierHeader, {
          "selected-preset-type": unref(selectedPresetType),
          "display-value": unref(displayValue),
          onChangePreset: unref(changePreset)
        }, null, 8, ["selected-preset-type", "display-value", "onChangePreset"])
      ]);
    };
  }
});
const EasingEditor = /* @__PURE__ */ _export_sfc(_sfc_main$9, [["__scopeId", "data-v-94b41026"]]);
const _sfc_main$8 = {
  components: {
    EasingEditor
  },
  props: {
    trackdata: {},
    modelValue: {
      type: Array,
      required: true
    }
  },
  emits: ["update:modelValue"],
  methods: {
    switchMode() {
      if (this.value.length === 4) {
        this.value = ["linear(0, 1)"];
      } else {
        this.value = [0.25, 0.1, 0.25, 1];
      }
    }
  },
  data() {
    return {
      value: this.modelValue
    };
  },
  watch: {
    value: {
      handler(newValue) {
        this.$emit("update:modelValue", JSON.parse(JSON.stringify(newValue)));
      },
      deep: true
    }
  }
};
const _hoisted_1$4 = { class: "easing-header" };
function _sfc_render$8(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_EasingEditor = resolveComponent("EasingEditor");
  return openBlock(), createElementBlock("div", _hoisted_1$4, [
    createBaseVNode("p", {
      onClick: _cache[0] || (_cache[0] = (...args) => $options.switchMode && $options.switchMode(...args))
    }, toDisplayString($data.value.length == 4 ? "cubic" : "linear"), 1),
    $data.value.length == 4 ? (openBlock(), createBlock(_component_EasingEditor, {
      key: 0,
      modelValue: $data.value,
      "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $data.value = $event)
    }, null, 8, ["modelValue"])) : withDirectives((openBlock(), createElementBlock("input", {
      key: 1,
      type: "text",
      "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $data.value[0] = $event),
      class: "form-control",
      placeholder: "linear(0, 1)"
    }, null, 512)), [
      [vModelText, $data.value[0]]
    ])
  ]);
}
const EasingEditorProxy = /* @__PURE__ */ _export_sfc(_sfc_main$8, [["render", _sfc_render$8], ["__scopeId", "data-v-ef242d4e"]]);
let easingEditorEmitter = mitt();
const _sfc_main$7 = {
  components: {
    EasingEditorProxy
  },
  directives: {
    drag,
    clickOutside
  },
  props: [
    "timeline",
    "bridge",
    "trackData"
  ],
  data() {
    return {
      editorTransform: "",
      easingEditor: false,
      listener: void 0
    };
  },
  beforeUnmount() {
    easingEditorEmitter.off("closeOthers", this.listener);
  },
  mounted() {
    easingEditorEmitter.on("closeOthers", this.listener = () => {
      this.easingEditor = false;
    });
  },
  methods: {
    openEasingEditor(event2) {
      easingEditorEmitter.emit("closeOthers");
      this.easingEditor = true;
      this.editorTransform = `translate(${event2.detail.x}px, ${event2.detail.y + 10}px)`;
    },
    handleDrag(event2) {
      if (this.easingEditor) {
        return;
      }
      this.trackData.times[this.bridge.end] += event2.detail.deltaX / (this.timeline.___zoom * 100);
      this.trackData.times[this.bridge.start] += event2.detail.deltaX / (this.timeline.___zoom * 100);
    }
  }
};
function _sfc_render$7(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_EasingEditorProxy = resolveComponent("EasingEditorProxy");
  const _directive_drag = resolveDirective("drag");
  const _directive_click_outside = resolveDirective("click-outside");
  return withDirectives((openBlock(), createElementBlock("div", {
    onDragging: _cache[2] || (_cache[2] = (...args) => $options.handleDrag && $options.handleDrag(...args)),
    onDraggingclick: _cache[3] || (_cache[3] = (...args) => $options.openEasingEditor && $options.openEasingEditor(...args)),
    style: normalizeStyle({
      transform: `translateX(${$props.trackData.times[$props.bridge.start] * $props.timeline.___zoom * 100}px) `,
      width: `${($props.trackData.times[$props.bridge.end] - $props.trackData.times[$props.bridge.start]) * ($props.timeline.___zoom * 100)}px`
    }),
    class: "keybridge"
  }, [
    (openBlock(), createBlock(Teleport, { to: "body" }, [
      createBaseVNode("div", {
        class: "easing-editor",
        style: normalizeStyle({
          transform: this.editorTransform
        })
      }, [
        $data.easingEditor ? (openBlock(), createBlock(_component_EasingEditorProxy, {
          key: 0,
          onClick: _cache[0] || (_cache[0] = withModifiers(() => {
          }, ["stop"])),
          trackdata: $props.trackData,
          modelValue: $props.trackData.bezier[$props.bridge.start],
          "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $props.trackData.bezier[$props.bridge.start] = $event)
        }, null, 8, ["trackdata", "modelValue"])) : createCommentVNode("", true)
      ], 4)
    ]))
  ], 36)), [
    [_directive_drag],
    [_directive_click_outside, () => {
      $data.easingEditor = false;
    }]
  ]);
}
const TickBridge = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["render", _sfc_render$7]]);
const _sfc_main$6 = {
  directives: {
    clickOutside,
    drag
  },
  data() {
    return {
      easingEditor: false,
      editorTransform: "",
      actual_time: 0,
      otherTicks: []
    };
  },
  props: [
    "timeline",
    "keyframe",
    "trackData"
  ],
  mounted() {
  },
  methods: {
    markSelected(otherTicks) {
      this.otherTicks = otherTicks;
    },
    clickoutsidemiddleware(event2) {
    },
    deleteTick() {
      this.trackData.bezier.splice(this.keyframe, 1);
      this.trackData.values.splice(this.keyframe, 1);
      this.trackData.times.splice(this.keyframe, 1);
    },
    handleDragStart(fromSelection = false) {
      if (this.otherTicks.length > 0 && fromSelection == false) {
        this.otherTicks.forEach((tick) => {
          tick.handleDragStart(true);
        });
      }
      this.actual_time = this.trackData.times[this.keyframe];
    },
    handleDrag(event2, fromSelection = false) {
      if (this.otherTicks.length > 0 && fromSelection == false) {
        this.otherTicks.forEach((tick) => {
          tick.handleDrag(event2, true);
        });
      }
      this.actual_time += event2.detail.deltaX / (this.timeline.___zoom * 100);
      this.trackData.times[this.keyframe] = fps(Math.max(0, this.actual_time), this.timeline);
    },
    openEasingEditor(event2) {
      this.easingEditor = true;
      this.editorTransform = `translate(${event2.detail.x}px, ${event2.detail.y + 10}px)`;
    }
  }
};
function _sfc_render$6(_ctx, _cache, $props, $setup, $data, $options) {
  const _directive_click_outside = resolveDirective("click-outside");
  const _directive_drag = resolveDirective("drag");
  return withDirectives((openBlock(), createElementBlock("div", {
    onDraggingstart: _cache[3] || (_cache[3] = ($event) => $options.handleDragStart()),
    onDraggingclick: _cache[4] || (_cache[4] = (...args) => $options.openEasingEditor && $options.openEasingEditor(...args)),
    onDragging: _cache[5] || (_cache[5] = (...args) => $options.handleDrag && $options.handleDrag(...args)),
    style: normalizeStyle({
      transform: `translateX(${$props.trackData.times[$props.keyframe] * $props.timeline.___zoom * 100}px) `
    }),
    class: normalizeClass([{
      selected: $data.otherTicks.length > 0
    }, "tick"])
  }, [
    (openBlock(), createBlock(Teleport, { to: "body" }, [
      $data.easingEditor ? (openBlock(), createElementBlock("div", {
        key: 0,
        ref: "tick_editor",
        class: "tick-editor",
        style: normalizeStyle({
          transform: this.editorTransform
        })
      }, [
        withDirectives(createBaseVNode("input", {
          type: "number",
          onClickCapture: _cache[0] || (_cache[0] = withModifiers(() => {
          }, ["stop"])),
          steps: "0.01",
          "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $props.trackData.values[$props.keyframe] = $event)
        }, null, 544), [
          [vModelText, $props.trackData.values[$props.keyframe]]
        ]),
        createBaseVNode("button", {
          onClick: _cache[2] || (_cache[2] = (...args) => $options.deleteTick && $options.deleteTick(...args))
        }, "Delete")
      ], 4)) : createCommentVNode("", true)
    ]))
  ], 38)), [
    [_directive_click_outside, () => {
      $data.easingEditor = false;
    }],
    [_directive_drag]
  ]);
}
const Tick = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["render", _sfc_render$6], ["__scopeId", "data-v-f3524842"]]);
const _sfc_main$5 = {
  components: {
    Tick,
    TickBridge
  },
  props: [
    "track",
    "parent",
    "tkey",
    "timeline"
  ],
  computed: {
    trackData() {
      return this.parent["___timeline_" + this.tkey];
    },
    evaluateKeyBridges() {
      let timesIndexTuple = [];
      for (let i = 0; i < this.trackData.times.length; i++) {
        timesIndexTuple.push([this.trackData.times[i], i]);
      }
      timesIndexTuple.sort((a, b) => a[0] - b[0]);
      let bridges = [];
      timesIndexTuple.forEach((value, index) => {
        if (timesIndexTuple[index + 1]) {
          bridges.push({
            start: timesIndexTuple[index][1],
            end: timesIndexTuple[index + 1][1]
          });
        }
      });
      return bridges;
    }
  },
  methods: {
    dropPoint(event2) {
      let x = event2.offsetX;
      let time = x / (this.timeline.___zoom * 100);
      let value = this.parent[this.tkey];
      this.trackData.values.push(value.value ? value.value : value);
      this.trackData.times.push(time);
      this.trackData.bezier.push([0, 0, 1, 1]);
    }
  }
};
const _hoisted_1$3 = { class: "track" };
function _sfc_render$5(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_TickBridge = resolveComponent("TickBridge");
  const _component_Tick = resolveComponent("Tick");
  return openBlock(), createElementBlock("div", _hoisted_1$3, [
    createBaseVNode("div", {
      class: "keyframes_container",
      style: normalizeStyle({
        width: `${($props.timeline.duration || 20) * $props.timeline.___zoom * 100}px`
      })
    }, [
      (openBlock(true), createElementBlock(Fragment, null, renderList($options.evaluateKeyBridges, (bridge) => {
        return openBlock(), createBlock(_component_TickBridge, {
          key: bridge,
          timeline: $props.timeline,
          bridge,
          trackData: $options.trackData
        }, null, 8, ["timeline", "bridge", "trackData"]);
      }), 128)),
      (openBlock(true), createElementBlock(Fragment, null, renderList($options.trackData.times, (keyframe, index) => {
        return openBlock(), createBlock(_component_Tick, {
          key: index,
          timeline: $props.timeline,
          trackData: $options.trackData,
          keyframe: index
        }, null, 8, ["timeline", "trackData", "keyframe"]);
      }), 128))
    ], 4)
  ]);
}
const Track = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["render", _sfc_render$5], ["__scopeId", "data-v-0de0b271"]]);
const _sfc_main$4 = {
  components: {
    Track
  },
  props: ["track", "parent", "timeline"],
  computed: {
    filteredKeys() {
      return Object.keys(this.track).filter((key) => !key.startsWith("_"));
    },
    timeline_items() {
      let obj = {};
      for (let key of this.filteredKeys) {
        if (this.track.hasOwnProperty(key)) {
          obj[key] = this.track[key];
        }
      }
      return obj;
    }
  }
};
const _hoisted_1$2 = { class: "tracks" };
const _hoisted_2$2 = {
  key: 1,
  class: "sub-tracks"
};
function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_Track = resolveComponent("Track");
  const _component_Tracks = resolveComponent("Tracks", true);
  return openBlock(true), createElementBlock(Fragment, null, renderList($options.timeline_items, (item, key) => {
    return openBlock(), createElementBlock("div", _hoisted_1$2, [
      typeof item !== "object" ? (openBlock(), createBlock(_component_Track, {
        key: 0,
        tkey: key,
        parent: $props.parent,
        timeline: $props.timeline,
        track: item
      }, {
        default: withCtx(() => [
          createTextVNode(toDisplayString(key), 1)
        ]),
        _: 2
      }, 1032, ["tkey", "parent", "timeline", "track"])) : (openBlock(), createElementBlock("div", _hoisted_2$2, [
        createBaseVNode("p", null, toDisplayString(key), 1),
        (openBlock(), createBlock(_component_Tracks, {
          key,
          parent: $props.parent[key],
          timeline: $props.timeline,
          track: item
        }, null, 8, ["parent", "timeline", "track"]))
      ]))
    ]);
  }), 256);
}
const Tracks = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["render", _sfc_render$4], ["__scopeId", "data-v-04d0c174"]]);
const _sfc_main$3 = {
  directives: {
    drag
  },
  props: ["timeline"],
  emits: ["draggingup"],
  data() {
    return {
      actual_time: this.timeline.___time
    };
  },
  methods: {
    setDragTime(event2) {
      this.$emit("draggingup", event2);
    },
    setTime(event2) {
      this.timeline.___time = fps(event2.detail.offsetX / (this.timeline.___zoom * 100), this.timeline);
      this.timeline[timeupdateSymbol]?.(this.timeline.___time);
    }
  }
};
function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
  const _directive_drag = resolveDirective("drag");
  return withDirectives((openBlock(), createElementBlock("div", {
    class: "time",
    onDragging: _cache[0] || (_cache[0] = (...args) => $options.setDragTime && $options.setDragTime(...args)),
    onDraggingclick: _cache[1] || (_cache[1] = (...args) => $options.setTime && $options.setTime(...args))
  }, [
    (openBlock(), createElementBlock(Fragment, null, renderList(20, (second) => {
      return createBaseVNode("div", {
        class: "timespan",
        style: normalizeStyle({
          width: $props.timeline.___zoom * 100 + "px"
          // adjust the width based on the zoom level
        })
      }, [
        createBaseVNode("span", null, toDisplayString(second - 1) + "s", 1)
      ], 4);
    }), 64))
  ], 32)), [
    [_directive_drag]
  ]);
}
const Time = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render$3], ["__scopeId", "data-v-7544cce0"]]);
const _sfc_main$2 = {
  directives: {
    drag
  },
  data() {
    return {
      last_drag: 0,
      actual_time: this.timeline.___time
    };
  },
  props: [
    "timeline"
  ],
  methods: {
    handleDragStart() {
      this.actual_time = this.timeline.___time;
    },
    handleDrag(event2) {
      this.actual_time += event2.detail.deltaX / (this.timeline.___zoom * 100);
      this.timeline.___time = fps(Math.max(0, this.actual_time), this.timeline);
      this.last_drag = performance.now();
      this.timeline[timeupdateSymbol]?.(this.timeline.___time);
    }
  },
  created() {
  },
  watch: {
    "timeline.___time"(newVal, oldVal) {
      if (performance.now() - this.last_drag > 100) {
        this.actual_time = newVal;
      }
    }
  }
};
function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
  const _directive_drag = resolveDirective("drag");
  return withDirectives((openBlock(), createElementBlock("div", {
    onDragging: _cache[0] || (_cache[0] = (...args) => $options.handleDrag && $options.handleDrag(...args)),
    onDraggingstart: _cache[1] || (_cache[1] = (...args) => $options.handleDragStart && $options.handleDragStart(...args)),
    style: normalizeStyle({
      transform: `translateX(${$props.timeline.___time * $props.timeline.___zoom * 100}px)`
    }),
    class: "time_control"
  }, null, 36)), [
    [_directive_drag]
  ]);
}
const TimeControl = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render$2], ["__scopeId", "data-v-c8a62ad4"]]);
const _sfc_main$1 = {
  components: {
    Properties,
    TimeControl,
    Tracks,
    Time
  },
  props: ["timeline", "title"],
  directives: {
    drag
  },
  data() {
    return {
      innerWidth,
      innerHeight,
      width: 800,
      alt: false,
      ctrl: false,
      shift: false,
      selecting: false,
      track_wrapper_left: 0,
      selecting_start: {
        x: 0,
        y: 0
      },
      selecting_end: {
        x: 0,
        y: 0
      },
      selection: {
        x: 0,
        y: 0,
        height: 0,
        width: 0,
        start_time: 0,
        end_time: 0
      },
      selected: [],
      selectedBridges: []
    };
  },
  created() {
    window.addEventListener("blur", (event2) => {
      this.alt = false;
      this.ctrl = false;
      this.shift = false;
    });
    window.addEventListener("keydown", (event2) => {
      this.alt = event2.altKey;
      this.ctrl = event2.ctrlKey;
      this.shift = event2.shiftKey;
      if (event2.key == "\\" && event2.ctrlKey) {
        this.close();
      }
    });
    window.addEventListener("keyup", (event2) => {
      this.alt = event2.altKey;
      this.ctrl = event2.ctrlKey;
      this.shift = event2.shiftKey;
    });
  },
  computed: {
    selecting_box() {
      return {
        left: Math.min(this.selecting_start.x, this.selecting_end.x),
        top: Math.min(this.selecting_start.y, this.selecting_end.y),
        width: Math.abs(this.selecting_end.x - this.selecting_start.x),
        height: Math.abs(this.selecting_end.y - this.selecting_start.y)
      };
    }
  },
  methods: {
    close() {
      this.timeline.___open = false;
    },
    handleTimedrag(e) {
      this.$refs.tracks_wrapper.scrollLeft -= e.detail.deltaX;
    },
    handleDrag(event2) {
      this.timeline.___x += event2.detail.deltaX;
      this.timeline.___y += event2.detail.deltaY;
    },
    handleSelectDragStart(e) {
      this.selecting = true;
      this.selecting_start.x = e.detail.offsetX;
      this.selecting_start.y = e.detail.offsetY;
      this.selecting_end.x = e.detail.offsetX;
      this.selecting_end.y = e.detail.offsetY;
    },
    handleTrackWrapperScroll(e) {
      this.track_wrapper_left = e.target.scrollLeft;
    },
    handleSelectDragEnd() {
      this.selecting = false;
      this.selection = {
        x: Math.min(this.selecting_start.x, this.selecting_end.x),
        y: Math.min(this.selecting_start.y, this.selecting_end.y),
        height: Math.abs(this.selecting_end.y - this.selecting_start.y),
        width: Math.abs(this.selecting_end.x - this.selecting_start.x),
        start_time: 0,
        end_time: 0
      };
      this.selection.start_time = this.timeline.___start_time + this.selection.x / this.timeline.___zoom * 1e3;
      this.selection.end_time = this.timeline.___start_time + (this.selection.x + this.selection.width) / this.timeline.___zoom * 1e3;
      this.selected.forEach((el) => {
        el.markSelected([]);
      });
      this.selectedBridges.forEach((el) => {
        el.markSelected([]);
      });
      this.selected = [];
      this.selectedBridges = [];
      this.$refs.tracks_wrapper.querySelectorAll(".tickbridge").forEach((el) => {
        const rect = el.getBoundingClientRect();
        const left = rect.left - this.$refs.tracks_wrapper.getBoundingClientRect().left;
        const top = rect.top - this.$refs.tracks_wrapper.getBoundingClientRect().top;
        const width = rect.width;
        const height = rect.height;
        if (left > this.selection.x && left + width < this.selection.x + this.selection.width && top > this.selection.y && top + height < this.selection.y + this.selection.height) {
          this.selected.push(el.__vnode.ctx.ctx);
        }
      });
      this.$refs.tracks_wrapper.querySelectorAll(".tick").forEach((el) => {
        const rect = el.getBoundingClientRect();
        const left = rect.left - this.$refs.tracks_wrapper.getBoundingClientRect().left;
        const top = rect.top - this.$refs.tracks_wrapper.getBoundingClientRect().top;
        const width = rect.width;
        const height = rect.height;
        if (left > this.selection.x && left + width < this.selection.x + this.selection.width && top > this.selection.y && top + height < this.selection.y + this.selection.height) {
          this.selected.push(el.__vnode.ctx.ctx);
        }
      });
      this.selectedBridges.forEach((el) => {
        el.markSelected(this.selected);
      });
      this.selected.forEach((el) => {
        el.markSelected(this.selected.filter((e) => e != el));
      });
    },
    handleSelectDrag(e) {
      this.selecting_end.x += e.detail.deltaX;
      this.selecting_end.y += e.detail.deltaY;
    },
    handleScroll(event2) {
      if (!this.shift) {
        let min = 0.2;
        let max = 10;
        this.timeline.___zoom = Math.max(
          min,
          Math.min(
            max,
            this.timeline.___zoom + event2.deltaY / -1e4
          )
        );
      } else {
        this.$refs.tracks_wrapper.scrollLeft += event2.deltaX / 10;
      }
      event2.preventDefault();
      event2.stopPropagation();
    }
  }
};
const _hoisted_1$1 = { class: "timeline_header" };
const _hoisted_2$1 = { class: "window_controls" };
const _hoisted_3$1 = { class: "properties_wrapper" };
function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_Properties = resolveComponent("Properties");
  const _component_Time = resolveComponent("Time");
  const _component_Tracks = resolveComponent("Tracks");
  const _component_TimeControl = resolveComponent("TimeControl");
  const _directive_drag = resolveDirective("drag");
  return openBlock(), createElementBlock("div", {
    style: normalizeStyle({
      top: Math.min($props.timeline.___y, $data.innerHeight - 50) + "px",
      left: Math.min($props.timeline.___x, $data.innerWidth - 50) + "px",
      width: $data.width + "px"
    }),
    onWheelCapture: _cache[6] || (_cache[6] = (...args) => $options.handleScroll && $options.handleScroll(...args)),
    class: "timeline_editor"
  }, [
    createBaseVNode("div", _hoisted_1$1, [
      withDirectives((openBlock(), createElementBlock("p", {
        onDragging: _cache[0] || (_cache[0] = (...args) => $options.handleDrag && $options.handleDrag(...args))
      }, [
        createTextVNode(toDisplayString($props.title), 1)
      ], 32)), [
        [_directive_drag]
      ]),
      createBaseVNode("div", _hoisted_2$1, [
        createBaseVNode("button", {
          class: "close",
          onClickCapture: _cache[1] || (_cache[1] = withModifiers((...args) => $options.close && $options.close(...args), ["stop"]))
        }, "x", 32)
      ])
    ]),
    createBaseVNode("div", _hoisted_3$1, [
      _cache[7] || (_cache[7] = createBaseVNode("div", { class: "spacer" }, null, -1)),
      createVNode(_component_Properties, {
        parent: $props.timeline,
        timeline: $props.timeline
      }, null, 8, ["parent", "timeline"])
    ]),
    createBaseVNode("div", {
      class: "tracks_wrapper",
      onScroll: _cache[5] || (_cache[5] = (...args) => $options.handleTrackWrapperScroll && $options.handleTrackWrapperScroll(...args)),
      ref: "tracks_wrapper",
      style: normalizeStyle({
        ["--zoom"]: $props.timeline.___zoom
      })
    }, [
      createVNode(_component_Time, {
        onDraggingup: $options.handleTimedrag,
        timeline: $props.timeline
      }, null, 8, ["onDraggingup", "timeline"]),
      createVNode(_component_Tracks, {
        parent: $props.timeline,
        track: $props.timeline,
        timeline: $props.timeline
      }, null, 8, ["parent", "track", "timeline"]),
      createVNode(_component_TimeControl, { timeline: $props.timeline }, null, 8, ["timeline"]),
      $data.shift ? withDirectives((openBlock(), createElementBlock("div", {
        key: 0,
        class: "track_selector",
        style: normalizeStyle({
          left: `${$data.track_wrapper_left}px`
        }),
        onDraggingend: _cache[2] || (_cache[2] = (...args) => $options.handleSelectDragEnd && $options.handleSelectDragEnd(...args)),
        onDraggingstart: _cache[3] || (_cache[3] = (...args) => $options.handleSelectDragStart && $options.handleSelectDragStart(...args)),
        onDragging: _cache[4] || (_cache[4] = (...args) => $options.handleSelectDrag && $options.handleSelectDrag(...args))
      }, [
        $data.selecting ? (openBlock(), createElementBlock("div", {
          key: 0,
          class: "track_selection",
          style: normalizeStyle({
            left: $options.selecting_box.left + "px",
            top: $options.selecting_box.top + "px",
            width: $options.selecting_box.width + "px",
            height: $options.selecting_box.height + "px"
          })
        }, null, 4)) : createCommentVNode("", true)
      ], 36)), [
        [_directive_drag]
      ]) : createCommentVNode("", true)
    ], 36)
  ], 36);
}
const TimelineEditor = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render$1]]);
const _sfc_main = {
  props: ["style"],
  components: {
    SchemaForm,
    TimelineEditor
  },
  data() {
    return {
      openoverrides: false,
      visible: true,
      labelSymbol,
      hasDiskState,
      overrideFile,
      storageKeySymbol,
      overridableFiles,
      removeOverrideFile,
      pickedTimeline: void 0,
      reactiveProperties,
      pickedProperty: void 0,
      picketPropertyFork: void 0,
      zodSchema: void 0,
      jsonSchema: void 0
    };
  },
  mounted() {
    window.addEventListener("keydown", (event2) => {
      if (event2.key == "\\" && (event2.ctrlKey || event2.metaKey)) {
        this.visible = !this.visible;
      }
    }, {
      capture: true
    });
  },
  methods: {
    copy() {
      if (this.ref_) {
        navigator.clipboard.writeText(JSON.stringify(this.ref_));
      }
    },
    paste() {
      if (this.ref_) {
        navigator.clipboard.readText().then((text) => {
          try {
            const data = JSON.parse(text);
            mergeDeep(this.ref_, data);
          } catch (e) {
          }
        });
      }
    },
    exportState() {
      exportState();
    },
    applyDiskState() {
      applyDiskState();
    },
    getTitle(ref2) {
      return ref2[storageKeySymbol];
    }
  },
  computed: {
    orderedReactiveProperties() {
      return this.reactiveProperties.slice().sort((a, b) => {
        return (a[labelSymbol] || a[storageKeySymbol]).localeCompare(b[labelSymbol] || b[storageKeySymbol]);
      });
    },
    openTimelines() {
      return this.reactiveProperties.map((root) => Object.values(root[forkSymbol]).map((timeline) => ({ timeline, root }))).flat().filter(({ timeline }) => timeline.___timeline && timeline.___open);
    },
    availableForks() {
      if (this.pickedProperty) {
        return Object.keys(this.pickedProperty[forkSymbol]).concat("~ARTIFACT~");
      }
    },
    ref_() {
      if (this.pickedProperty) {
        if (this.picketPropertyFork == "~ARTIFACT~") {
          return this.pickedProperty;
        }
        return this.pickedProperty[forkSymbol][this.picketPropertyFork];
      }
    }
  },
  watch: {
    pickedProperty(v) {
      if (v[schemaSymbol]) {
        this.picketPropertyFork = "default";
        this.zodSchema = v[schemaSymbol];
        this.jsonSchema = zodToJsonSchema(v[schemaSymbol]);
      }
    }
  }
};
const _hoisted_1 = ["value"];
const _hoisted_2 = { key: 0 };
const _hoisted_3 = { key: 1 };
const _hoisted_4 = { key: 2 };
const _hoisted_5 = { class: "row" };
const _hoisted_6 = { class: "widget right" };
const _hoisted_7 = { class: "list" };
const _hoisted_8 = ["onClick"];
const _hoisted_9 = {
  key: 0,
  class: "widget",
  open: ""
};
const _hoisted_10 = { class: "list" };
const _hoisted_11 = ["title", "onClick"];
const _hoisted_12 = ["onClick"];
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_SchemaForm = resolveComponent("SchemaForm");
  const _component_TimelineEditor = resolveComponent("TimelineEditor");
  return openBlock(), createElementBlock(Fragment, null, [
    withDirectives(createBaseVNode("div", {
      style: normalizeStyle($props.style),
      class: "properties"
    }, [
      $data.pickedProperty ? (openBlock(), createElementBlock("div", {
        class: "widget left",
        key: $data.pickedProperty[$data.storageKeySymbol]
      }, [
        createBaseVNode("div", {
          class: "list",
          onWheelCapture: _cache[4] || (_cache[4] = withModifiers(() => {
          }, ["stop"]))
        }, [
          withDirectives(createBaseVNode("select", {
            "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $data.picketPropertyFork = $event)
          }, [
            (openBlock(true), createElementBlock(Fragment, null, renderList($options.availableForks, (fork) => {
              return openBlock(), createElementBlock("option", { value: fork }, toDisplayString(fork), 9, _hoisted_1);
            }), 256))
          ], 512), [
            [vModelSelect, $data.picketPropertyFork]
          ]),
          $data.picketPropertyFork != "~ARTIFACT~" ? (openBlock(), createElementBlock("label", _hoisted_2, " Weight : " + toDisplayString($options.ref_.___weight), 1)) : createCommentVNode("", true),
          ("ref" in _ctx ? _ctx.ref : unref(ref)).___temporary ? (openBlock(), createElementBlock("label", _hoisted_3, " Temporary : " + toDisplayString($options.ref_.___temporary), 1)) : createCommentVNode("", true),
          $options.ref_.___timeline ? (openBlock(), createElementBlock("label", _hoisted_4, " Time : " + toDisplayString($options.ref_.___time.toFixed("2")), 1)) : createCommentVNode("", true),
          createBaseVNode("div", _hoisted_5, [
            createBaseVNode("button", {
              onClick: _cache[1] || (_cache[1] = (...args) => $options.copy && $options.copy(...args))
            }, " Copy "),
            createBaseVNode("button", {
              onClick: _cache[2] || (_cache[2] = (...args) => $options.paste && $options.paste(...args))
            }, " Paste ")
          ]),
          $options.ref_.___timeline ? (openBlock(), createElementBlock("button", {
            key: 3,
            onClick: _cache[3] || (_cache[3] = () => {
              $options.ref_.___open = !$options.ref_.___open;
            })
          }, toDisplayString($options.ref_.___open ? "Close timeline" : "Open Timeline"), 1)) : createCommentVNode("", true),
          (openBlock(), createBlock(_component_SchemaForm, {
            key: $options.ref_,
            tkey: $data.picketPropertyFork,
            disabled: $data.picketPropertyFork == "~ARTIFACT~",
            zod: $data.zodSchema,
            schema: $data.jsonSchema,
            getRef: () => $options.ref_
          }, null, 8, ["tkey", "disabled", "zod", "schema", "getRef"]))
        ], 32)
      ])) : createCommentVNode("", true),
      (openBlock(true), createElementBlock(Fragment, null, renderList($options.openTimelines, (timeline) => {
        return openBlock(), createBlock(_component_TimelineEditor, {
          title: $options.getTitle(timeline.root) + " ~ " + $options.getTitle(timeline.timeline),
          timeline: timeline.timeline
        }, null, 8, ["title", "timeline"]);
      }), 256)),
      createBaseVNode("div", _hoisted_6, [
        createBaseVNode("ul", _hoisted_7, [
          (openBlock(true), createElementBlock(Fragment, null, renderList($options.orderedReactiveProperties, (property) => {
            return openBlock(), createElementBlock("li", {
              class: normalizeClass({
                active: $data.pickedProperty == property
              }),
              onClick: ($event) => $data.pickedProperty = property
            }, toDisplayString(property[$data.labelSymbol] || property[$data.storageKeySymbol]), 11, _hoisted_8);
          }), 256))
        ]),
        $data.hasDiskState ? (openBlock(), createElementBlock("button", {
          key: 0,
          onClick: _cache[5] || (_cache[5] = (...args) => $options.applyDiskState && $options.applyDiskState(...args))
        }, " Apply local state")) : createCommentVNode("", true),
        createBaseVNode("button", {
          onClick: _cache[6] || (_cache[6] = (...args) => $options.exportState && $options.exportState(...args))
        }, " Export state"),
        createBaseVNode("button", {
          onClick: _cache[7] || (_cache[7] = ($event) => $data.openoverrides = !$data.openoverrides)
        }, toDisplayString($data.openoverrides ? "Close" : "Open") + " files overrides", 1)
      ])
    ], 4), [
      [vShow, $data.visible]
    ]),
    $data.openoverrides ? (openBlock(), createElementBlock("dialog", _hoisted_9, [
      _cache[8] || (_cache[8] = createBaseVNode("p", null, "Override files", -1)),
      createBaseVNode("ul", _hoisted_10, [
        (openBlock(true), createElementBlock(Fragment, null, renderList($data.overridableFiles, (file, key) => {
          return openBlock(), createElementBlock("li", {
            title: "Replace " + key,
            style: { "display": "flex", "flex-flow": "row" },
            onClick: ($event) => $data.overrideFile(key)
          }, [
            createTextVNode(toDisplayString(key) + " ", 1),
            file ? (openBlock(), createElementBlock("button", {
              key: 0,
              style: { "min-width": "auto", "padding": "10px", "width": "fit-content", "align-items": "center", "justify-content": "center" },
              onClick: withModifiers(($event) => $data.removeOverrideFile(key), ["stop"])
            }, "Remove", 8, _hoisted_12)) : createCommentVNode("", true)
          ], 8, _hoisted_11);
        }), 256))
      ])
    ])) : createCommentVNode("", true)
  ], 64);
}
const Studio = /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render]]);
export {
  Studio as default
};
