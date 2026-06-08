-- Adminer 5.4.2 PostgreSQL 18.4 dump

DROP TABLE IF EXISTS "cpus";
DROP SEQUENCE IF EXISTS "public".cpus_cpu_id_seq;
CREATE SEQUENCE "public".cpus_cpu_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1;

CREATE TABLE "public"."cpus" (
    "cpu_id" integer DEFAULT nextval('cpus_cpu_id_seq') NOT NULL,
    "cpu_name" character varying NOT NULL,
    "cpu_cores" integer NOT NULL,
    "cpu_threads" integer NOT NULL,
    "cpu_frequency" integer NOT NULL,
    CONSTRAINT "cpus_pkey" PRIMARY KEY ("cpu_id")
)
WITH (oids = false);


DROP TABLE IF EXISTS "hostings";
DROP SEQUENCE IF EXISTS "public".hostings_hosting_id_seq;
CREATE SEQUENCE "public".hostings_hosting_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1;

CREATE TABLE "public"."hostings" (
    "hosting_id" integer DEFAULT nextval('hostings_hosting_id_seq') NOT NULL,
    "hosting_name" character varying NOT NULL,
    "server_id" integer NOT NULL,
    "hosting_ram" integer NOT NULL,
    "hosting_space" integer NOT NULL,
    "price_per_month" integer NOT NULL,
    "hosting_vcpu" smallint NOT NULL,
    "hosting_traffic" integer NOT NULL,
    "hosting_omit" boolean NOT NULL,
    CONSTRAINT "hostings_pkey" PRIMARY KEY ("hosting_id")
)
WITH (oids = false);


DROP TABLE IF EXISTS "password_resets";
DROP SEQUENCE IF EXISTS "public".password_resets_reset_id_seq;
CREATE SEQUENCE "public"._password_resets_reset_id_seq1 INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1;

CREATE TABLE "public"."password_resets" (
    "reset_id" integer DEFAULT nextval('_password_resets_reset_id_seq1') NOT NULL,
    "user_id" integer NOT NULL,
    "reset_token_hash" character varying(64) NOT NULL,
    "reset_expires_at" timestamp NOT NULL,
    CONSTRAINT "_password_resets_pkey1" PRIMARY KEY ("reset_id")
)
WITH (oids = false);


DROP TABLE IF EXISTS "permission_levels";
DROP SEQUENCE IF EXISTS "public".permission_levels_level_id_seq;
CREATE SEQUENCE "public".permission_levels_level_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1;

CREATE TABLE "public"."permission_levels" (
    "level_id" integer DEFAULT nextval('permission_levels_level_id_seq') NOT NULL,
    "level_name" character varying NOT NULL,
    CONSTRAINT "permission_levels_pkey" PRIMARY KEY ("level_id")
)
WITH (oids = false);

INSERT INTO "permission_levels" ("level_id", "level_name") VALUES
(1,	'Пользователь'),
(2,	'Администратор');

DROP TABLE IF EXISTS "request_states";
DROP SEQUENCE IF EXISTS "public".request_states_state_id_seq;
CREATE SEQUENCE "public".request_states_state_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1;

CREATE TABLE "public"."request_states" (
    "state_id" integer DEFAULT nextval('request_states_state_id_seq') NOT NULL,
    "state_name" character varying NOT NULL,
    CONSTRAINT "request_states_pkey" PRIMARY KEY ("state_id")
)
WITH (oids = false);


DROP TABLE IF EXISTS "requests";
DROP SEQUENCE IF EXISTS "public".requests_request_id_seq;
CREATE SEQUENCE "public".requests_request_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1;

CREATE TABLE "public"."requests" (
    "request_id" integer DEFAULT nextval('requests_request_id_seq') NOT NULL,
    "state_id" integer NOT NULL,
    "hosting_id" integer NOT NULL,
    "user_id" integer,
    "request_months" integer NOT NULL,
    "request_expiration_date" timestamp,
    "request_note" character varying,
    "request_price_final" integer NOT NULL,
    "request_ssh_key_name" character varying,
    "request_ipv4" character varying(16),
    "request_reject_note" character varying,
    "request_space_reserved" smallint NOT NULL,
    CONSTRAINT "requests_pkey" PRIMARY KEY ("request_id")
)
WITH (oids = false);


DROP TABLE IF EXISTS "servers";
DROP SEQUENCE IF EXISTS "public".servers_server_id_seq;
CREATE SEQUENCE "public".servers_server_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1;

CREATE TABLE "public"."servers" (
    "server_id" integer DEFAULT nextval('servers_server_id_seq') NOT NULL,
    "server_name" character varying NOT NULL,
    "cpu_id" integer NOT NULL,
    "server_space_total" integer,
    "server_space_reserved" integer,
    "server_omit" boolean NOT NULL,
    CONSTRAINT "servers_pkey" PRIMARY KEY ("server_id")
)
WITH (oids = false);


DROP TABLE IF EXISTS "users";
DROP SEQUENCE IF EXISTS "public".users_user_id_seq;
CREATE SEQUENCE "public".users_user_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1;

CREATE TABLE "public"."users" (
    "user_id" integer DEFAULT nextval('users_user_id_seq') NOT NULL,
    "email" character varying NOT NULL,
    "login" character varying NOT NULL,
    "password" character varying NOT NULL,
    "first_name" character varying NOT NULL,
    "last_name" character varying NOT NULL,
    "second_name" character varying,
    "level_id" integer NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
)
WITH (oids = false);

CREATE UNIQUE INDEX users_email ON public.users USING btree (email);

INSERT INTO "users" ("user_id", "email", "login", "password", "first_name", "last_name", "second_name", "level_id") VALUES
(1,	'admin@mail.com',	'admin',	'$2y$12$lIOeqM9szqksF2vgW/fRrOTZ.peGzR425WgSg7yJL7k5.k2HGnmrW',	'Admin',	'Admin',	NULL,	2);

ALTER TABLE ONLY "public"."hostings" ADD CONSTRAINT "hostings_server_id_fkey" FOREIGN KEY (server_id) REFERENCES servers(server_id);

ALTER TABLE ONLY "public"."password_resets" ADD CONSTRAINT "_password_resets_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(user_id);

ALTER TABLE ONLY "public"."requests" ADD CONSTRAINT "requests_hosting_id_fkey" FOREIGN KEY (hosting_id) REFERENCES hostings(hosting_id);
ALTER TABLE ONLY "public"."requests" ADD CONSTRAINT "requests_state_id_fkey" FOREIGN KEY (state_id) REFERENCES request_states(state_id);
ALTER TABLE ONLY "public"."requests" ADD CONSTRAINT "requests_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(user_id);

ALTER TABLE ONLY "public"."servers" ADD CONSTRAINT "servers_cpu_id_fkey" FOREIGN KEY (cpu_id) REFERENCES cpus(cpu_id);

-- 2026-06-08 18:31:14 UTC
