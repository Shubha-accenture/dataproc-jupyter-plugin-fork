import { z } from 'zod';

// Reusable schema for GCS/HDFS/File paths
const uriSchema = z
  .string()
  .regex(
    /^(gs|file|hdfs):\/\//,
    "File must include a valid scheme prefix: 'file://', 'gs://', or 'hdfs://'"
  );

// Reusable schema for arrays of paths that must be unique
const uniqueUriArray = z
  .array(uriSchema)
  .optional()
  .refine(
    (items) => {
      if (!items || items.length === 0) return true;
      const uniqueItems = new Set(items.map((i) => i.toLowerCase()));
      return uniqueItems.size === items.length;
    },
    { message: 'Duplicate paths are not allowed' }
  );

// Reusable schema for simple string arrays (like arguments)
const uniqueStringArray = z
  .array(z.string())
  .optional()
  .refine(
    (items) => {
      if (!items || items.length === 0) return true;
      const uniqueItems = new Set(items.map((i) => i.toLowerCase()));
      return uniqueItems.size === items.length;
    },
    { message: 'Duplicate arguments are not allowed' }
  );
  
// Reusable schema for your Key/Value properties
const keyValueSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.string().min(1, "Value is required"),
}).array().optional()
  .refine(
    (items) => {
       if (!items || items.length === 0) return true;
       const keys = items.map(i => i.key);
       return new Set(keys).size === keys.length;
    },
    { message: "Duplicate keys are not allowed" }
  );

// This is the base schema for all job types
const baseJobSchema = z.object({
  cluster: z.string().min(1, 'Cluster is required'),
  jobId: z
    .string()
    .min(1, 'ID is required')
    .regex(
      /^[a-zA-Z0-9-_]+$/,
      'ID must contain only letters, numbers, hyphens, and underscores'
    ),
  maxRestarts: z.string().optional(),
  properties: keyValueSchema,
  labels: keyValueSchema,
  jobType: z.enum(['Spark', 'SparkR', 'SparkSql', 'PySpark']),
});

// We create separate schemas for each job type's specific fields
const sparkSchema = baseJobSchema.extend({
  jobType: z.literal('Spark'),
  mainClass: z.string().min(1, 'Main class or jar is required'),
  jarFiles: uniqueUriArray,
  files: uniqueUriArray,
  archives: uniqueUriArray,
  args: uniqueStringArray,
});

const sparkRSchema = baseJobSchema.extend({
  jobType: z.literal('SparkR'),
  mainRFile: uriSchema.min(1, 'Main R file is required'),
  files: uniqueUriArray,
  args: uniqueStringArray,
});

const pySparkSchema = baseJobSchema.extend({
  jobType: z.literal('PySpark'),
  mainPythonFile: uriSchema.min(1, 'Main Python file is required'),
  pythonFiles: uniqueUriArray,
  jarFiles: uniqueUriArray,
  files: uniqueUriArray,
  archives: uniqueUriArray,
  args: uniqueStringArray,
});

const sparkSqlSchema = baseJobSchema.extend({
  jobType: z.literal('SparkSql'),
  querySource: z.enum(['Query file', 'Query text']),
  queryFile: z.string().optional(),
  queryText: z.string().optional(),
  jarFiles: uniqueUriArray,
  parameters: keyValueSchema,
}).superRefine((data, ctx) => {
  // This handles the nested conditional logic for SparkSQL
  if (data.querySource === 'Query file' && !data.queryFile) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['queryFile'],
      message: 'Query file is required',
    });
  } else if (data.querySource === 'Query file' && data.queryFile) {
    // You can even validate the file path here
    if (!/^(gs|file|hdfs):\/\//.test(data.queryFile)) {
       ctx.addIssue({
         code: z.ZodIssueCode.custom,
         path: ['queryFile'],
         message: "File must include a valid scheme prefix: 'file://', 'gs://', or 'hdfs://'"
       });
    }
  }
  
  if (data.querySource === 'Query text' && !data.queryText) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['queryText'],
      message: 'Query text is required',
    });
  }
});

// We combine them into a single schema
export const jobSchema = z.discriminatedUnion('jobType', [
  sparkSchema,
  sparkRSchema,
  pySparkSchema,
  sparkSqlSchema,
]);

// We also need to get the TS type from our schema
export type JobFormValues = z.infer<typeof jobSchema>;