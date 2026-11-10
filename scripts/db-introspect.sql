-- Emits the public schema as one JSON document for scripts/gen-db-types.ts.
select json_build_object(
  'tables', coalesce((select json_agg(t order by t.name) from (
    select c.relname as name, c.relkind as kind,
      (select json_agg(json_build_object(
          'name', a.attname,
          'type', format_type(a.atttypid, null),
          'udt', ty.typname,
          'elem', el.typname,
          'nullable', not a.attnotnull,
          'hasDefault', a.atthasdef or a.attidentity <> '' ,
          'generated', a.attgenerated <> '') order by a.attnum)
       from pg_attribute a join pg_type ty on ty.oid = a.atttypid left join pg_type el on el.oid = ty.typelem and ty.typcategory = 'A'
       where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped) as columns,
      (select coalesce(json_agg(json_build_object(
          'foreignKeyName', k.conname,
          'columns', (select json_agg(att.attname order by u.ord) from unnest(k.conkey) with ordinality u(n, ord) join pg_attribute att on att.attrelid = k.conrelid and att.attnum = u.n),
          'referencedRelation', rc.relname,
          'referencedColumns', (select json_agg(att.attname order by u.ord) from unnest(k.confkey) with ordinality u(n, ord) join pg_attribute att on att.attrelid = k.confrelid and att.attnum = u.n),
          'isOneToOne', exists (select 1 from pg_index i where i.indrelid = k.conrelid and i.indisunique and i.indkey::int2[] @> k.conkey and array_length(k.conkey,1) = i.indnatts)
        ) order by k.conname), '[]'::json)
       from pg_constraint k join pg_class rc on rc.oid = k.confrelid
       where k.conrelid = c.oid and k.contype = 'f' and rc.relnamespace = 'public'::regnamespace) as relationships
    from pg_class c where c.relnamespace = 'public'::regnamespace and c.relkind in ('r','v','m','p')
  ) t), '[]'),
  'enums', coalesce((select json_object_agg(t.typname, (select json_agg(e.enumlabel order by e.enumsortorder) from pg_enum e where e.enumtypid = t.oid))
    from pg_type t where t.typnamespace = 'public'::regnamespace and t.typtype = 'e'), '{}'),
  'functions', coalesce((select json_agg(f order by f.name, f.args::text) from (
    select p.proname as name, p.proretset as setof,
      rt.typname as ret, rel.typname as ret_elem,
      (select json_agg(json_build_object('name', p.proargnames[i], 'udt', at.typname, 'elem', ael.typname, 'mode', coalesce(p.proargmodes[i], 'i'))
                      order by i)
         from generate_subscripts(coalesce(p.proallargtypes, (select array_agg(x order by o) from unnest(p.proargtypes::oid[]) with ordinality u(x, o))), 1) i
         join pg_type at on at.oid = (coalesce(p.proallargtypes, (select array_agg(x order by o) from unnest(p.proargtypes::oid[]) with ordinality u(x, o))))[i]
         left join pg_type ael on ael.oid = at.typelem and at.typcategory = 'A') as args,
      p.pronargdefaults as ndefaults, p.pronargs as nargs
    from pg_proc p join pg_type rt on rt.oid = p.prorettype left join pg_type rel on rel.oid = rt.typelem and rt.typcategory = 'A'
    where p.pronamespace = 'public'::regnamespace and p.prokind = 'f' and rt.typname <> 'trigger'
  ) f), '[]')
);
