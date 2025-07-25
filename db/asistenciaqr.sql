PGDMP  *                    }            postgres    17.5    17.5 ;    d           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                           false            e           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                           false            f           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                           false            g           1262    5    postgres    DATABASE     �   CREATE DATABASE postgres WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'English_United States.1252';
    DROP DATABASE postgres;
                     postgres    false            h           0    0    DATABASE postgres    COMMENT     N   COMMENT ON DATABASE postgres IS 'default administrative connection database';
                        postgres    false    4967                        2615    16483    asistenciaqr    SCHEMA        CREATE SCHEMA asistenciaqr;
    DROP SCHEMA asistenciaqr;
                     postgres    false            �            1259    16504    alumnos    TABLE     �   CREATE TABLE asistenciaqr.alumnos (
    id integer NOT NULL,
    nombre_completo character varying(100) NOT NULL,
    carnet character varying(20) NOT NULL,
    salon_id integer,
    activo boolean DEFAULT true
);
 !   DROP TABLE asistenciaqr.alumnos;
       asistenciaqr         heap r       postgres    false    6            �            1259    16503    alumnos_id_seq    SEQUENCE     �   CREATE SEQUENCE asistenciaqr.alumnos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE asistenciaqr.alumnos_id_seq;
       asistenciaqr               postgres    false    223    6            i           0    0    alumnos_id_seq    SEQUENCE OWNED BY     M   ALTER SEQUENCE asistenciaqr.alumnos_id_seq OWNED BY asistenciaqr.alumnos.id;
          asistenciaqr               postgres    false    222            �            1259    16547 
   asistencia    TABLE     h  CREATE TABLE asistenciaqr.asistencia (
    id integer NOT NULL,
    alumno_id integer,
    fecha_id integer,
    estado character varying(20) NOT NULL,
    registrado_por integer,
    CONSTRAINT asistencia_estado_check CHECK (((estado)::text = ANY ((ARRAY['presente'::character varying, 'ausente'::character varying, 'tarde'::character varying])::text[])))
);
 $   DROP TABLE asistenciaqr.asistencia;
       asistenciaqr         heap r       postgres    false    6            �            1259    16546    asistencia_id_seq    SEQUENCE     �   CREATE SEQUENCE asistenciaqr.asistencia_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 .   DROP SEQUENCE asistenciaqr.asistencia_id_seq;
       asistenciaqr               postgres    false    6    229            j           0    0    asistencia_id_seq    SEQUENCE OWNED BY     S   ALTER SEQUENCE asistenciaqr.asistencia_id_seq OWNED BY asistenciaqr.asistencia.id;
          asistenciaqr               postgres    false    228            �            1259    16519    docentes_salones    TABLE     v   CREATE TABLE asistenciaqr.docentes_salones (
    id integer NOT NULL,
    docente_id integer,
    salon_id integer
);
 *   DROP TABLE asistenciaqr.docentes_salones;
       asistenciaqr         heap r       postgres    false    6            �            1259    16518    docentes_salones_id_seq    SEQUENCE     �   CREATE SEQUENCE asistenciaqr.docentes_salones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 4   DROP SEQUENCE asistenciaqr.docentes_salones_id_seq;
       asistenciaqr               postgres    false    6    225            k           0    0    docentes_salones_id_seq    SEQUENCE OWNED BY     _   ALTER SEQUENCE asistenciaqr.docentes_salones_id_seq OWNED BY asistenciaqr.docentes_salones.id;
          asistenciaqr               postgres    false    224            �            1259    16538    fechas_asistencia    TABLE     b   CREATE TABLE asistenciaqr.fechas_asistencia (
    id integer NOT NULL,
    fecha date NOT NULL
);
 +   DROP TABLE asistenciaqr.fechas_asistencia;
       asistenciaqr         heap r       postgres    false    6            �            1259    16537    fechas_asistencia_id_seq    SEQUENCE     �   CREATE SEQUENCE asistenciaqr.fechas_asistencia_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 5   DROP SEQUENCE asistenciaqr.fechas_asistencia_id_seq;
       asistenciaqr               postgres    false    6    227            l           0    0    fechas_asistencia_id_seq    SEQUENCE OWNED BY     a   ALTER SEQUENCE asistenciaqr.fechas_asistencia_id_seq OWNED BY asistenciaqr.fechas_asistencia.id;
          asistenciaqr               postgres    false    226            �            1259    16497    salones    TABLE     �   CREATE TABLE asistenciaqr.salones (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL,
    grado character varying(20),
    seccion character varying(10),
    jornada character varying(20)
);
 !   DROP TABLE asistenciaqr.salones;
       asistenciaqr         heap r       postgres    false    6            �            1259    16496    salones_id_seq    SEQUENCE     �   CREATE SEQUENCE asistenciaqr.salones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE asistenciaqr.salones_id_seq;
       asistenciaqr               postgres    false    6    221            m           0    0    salones_id_seq    SEQUENCE OWNED BY     M   ALTER SEQUENCE asistenciaqr.salones_id_seq OWNED BY asistenciaqr.salones.id;
          asistenciaqr               postgres    false    220            �            1259    16485    usuarios    TABLE       CREATE TABLE asistenciaqr.usuarios (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    correo character varying(100) NOT NULL,
    password text NOT NULL,
    rol character varying(20) NOT NULL,
    telefono character varying(20),
    direccion text,
    especialidad character varying(100),
    grado character varying(50),
    fecha_nacimiento date,
    CONSTRAINT usuarios_rol_check CHECK (((rol)::text = ANY ((ARRAY['docente'::character varying, 'direccion'::character varying])::text[])))
);
 "   DROP TABLE asistenciaqr.usuarios;
       asistenciaqr         heap r       postgres    false    6            �            1259    16484    usuarios_id_seq    SEQUENCE     �   CREATE SEQUENCE asistenciaqr.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 ,   DROP SEQUENCE asistenciaqr.usuarios_id_seq;
       asistenciaqr               postgres    false    6    219            n           0    0    usuarios_id_seq    SEQUENCE OWNED BY     O   ALTER SEQUENCE asistenciaqr.usuarios_id_seq OWNED BY asistenciaqr.usuarios.id;
          asistenciaqr               postgres    false    218            �           2604    16507 
   alumnos id    DEFAULT     t   ALTER TABLE ONLY asistenciaqr.alumnos ALTER COLUMN id SET DEFAULT nextval('asistenciaqr.alumnos_id_seq'::regclass);
 ?   ALTER TABLE asistenciaqr.alumnos ALTER COLUMN id DROP DEFAULT;
       asistenciaqr               postgres    false    223    222    223            �           2604    16550    asistencia id    DEFAULT     z   ALTER TABLE ONLY asistenciaqr.asistencia ALTER COLUMN id SET DEFAULT nextval('asistenciaqr.asistencia_id_seq'::regclass);
 B   ALTER TABLE asistenciaqr.asistencia ALTER COLUMN id DROP DEFAULT;
       asistenciaqr               postgres    false    229    228    229            �           2604    16522    docentes_salones id    DEFAULT     �   ALTER TABLE ONLY asistenciaqr.docentes_salones ALTER COLUMN id SET DEFAULT nextval('asistenciaqr.docentes_salones_id_seq'::regclass);
 H   ALTER TABLE asistenciaqr.docentes_salones ALTER COLUMN id DROP DEFAULT;
       asistenciaqr               postgres    false    225    224    225            �           2604    16541    fechas_asistencia id    DEFAULT     �   ALTER TABLE ONLY asistenciaqr.fechas_asistencia ALTER COLUMN id SET DEFAULT nextval('asistenciaqr.fechas_asistencia_id_seq'::regclass);
 I   ALTER TABLE asistenciaqr.fechas_asistencia ALTER COLUMN id DROP DEFAULT;
       asistenciaqr               postgres    false    226    227    227            �           2604    16500 
   salones id    DEFAULT     t   ALTER TABLE ONLY asistenciaqr.salones ALTER COLUMN id SET DEFAULT nextval('asistenciaqr.salones_id_seq'::regclass);
 ?   ALTER TABLE asistenciaqr.salones ALTER COLUMN id DROP DEFAULT;
       asistenciaqr               postgres    false    221    220    221            �           2604    16488    usuarios id    DEFAULT     v   ALTER TABLE ONLY asistenciaqr.usuarios ALTER COLUMN id SET DEFAULT nextval('asistenciaqr.usuarios_id_seq'::regclass);
 @   ALTER TABLE asistenciaqr.usuarios ALTER COLUMN id DROP DEFAULT;
       asistenciaqr               postgres    false    218    219    219            [          0    16504    alumnos 
   TABLE DATA                 asistenciaqr               postgres    false    223   .I       a          0    16547 
   asistencia 
   TABLE DATA                 asistenciaqr               postgres    false    229   �I       ]          0    16519    docentes_salones 
   TABLE DATA                 asistenciaqr               postgres    false    225   �I       _          0    16538    fechas_asistencia 
   TABLE DATA                 asistenciaqr               postgres    false    227   'J       Y          0    16497    salones 
   TABLE DATA                 asistenciaqr               postgres    false    221   AJ       W          0    16485    usuarios 
   TABLE DATA                 asistenciaqr               postgres    false    219   �J       o           0    0    alumnos_id_seq    SEQUENCE SET     B   SELECT pg_catalog.setval('asistenciaqr.alumnos_id_seq', 3, true);
          asistenciaqr               postgres    false    222            p           0    0    asistencia_id_seq    SEQUENCE SET     F   SELECT pg_catalog.setval('asistenciaqr.asistencia_id_seq', 1, false);
          asistenciaqr               postgres    false    228            q           0    0    docentes_salones_id_seq    SEQUENCE SET     K   SELECT pg_catalog.setval('asistenciaqr.docentes_salones_id_seq', 1, true);
          asistenciaqr               postgres    false    224            r           0    0    fechas_asistencia_id_seq    SEQUENCE SET     M   SELECT pg_catalog.setval('asistenciaqr.fechas_asistencia_id_seq', 1, false);
          asistenciaqr               postgres    false    226            s           0    0    salones_id_seq    SEQUENCE SET     B   SELECT pg_catalog.setval('asistenciaqr.salones_id_seq', 1, true);
          asistenciaqr               postgres    false    220            t           0    0    usuarios_id_seq    SEQUENCE SET     C   SELECT pg_catalog.setval('asistenciaqr.usuarios_id_seq', 7, true);
          asistenciaqr               postgres    false    218            �           2606    16512    alumnos alumnos_carnet_key 
   CONSTRAINT     ]   ALTER TABLE ONLY asistenciaqr.alumnos
    ADD CONSTRAINT alumnos_carnet_key UNIQUE (carnet);
 J   ALTER TABLE ONLY asistenciaqr.alumnos DROP CONSTRAINT alumnos_carnet_key;
       asistenciaqr                 postgres    false    223            �           2606    16510    alumnos alumnos_pkey 
   CONSTRAINT     X   ALTER TABLE ONLY asistenciaqr.alumnos
    ADD CONSTRAINT alumnos_pkey PRIMARY KEY (id);
 D   ALTER TABLE ONLY asistenciaqr.alumnos DROP CONSTRAINT alumnos_pkey;
       asistenciaqr                 postgres    false    223            �           2606    16555 ,   asistencia asistencia_alumno_id_fecha_id_key 
   CONSTRAINT     |   ALTER TABLE ONLY asistenciaqr.asistencia
    ADD CONSTRAINT asistencia_alumno_id_fecha_id_key UNIQUE (alumno_id, fecha_id);
 \   ALTER TABLE ONLY asistenciaqr.asistencia DROP CONSTRAINT asistencia_alumno_id_fecha_id_key;
       asistenciaqr                 postgres    false    229    229            �           2606    16553    asistencia asistencia_pkey 
   CONSTRAINT     ^   ALTER TABLE ONLY asistenciaqr.asistencia
    ADD CONSTRAINT asistencia_pkey PRIMARY KEY (id);
 J   ALTER TABLE ONLY asistenciaqr.asistencia DROP CONSTRAINT asistencia_pkey;
       asistenciaqr                 postgres    false    229            �           2606    16526 9   docentes_salones docentes_salones_docente_id_salon_id_key 
   CONSTRAINT     �   ALTER TABLE ONLY asistenciaqr.docentes_salones
    ADD CONSTRAINT docentes_salones_docente_id_salon_id_key UNIQUE (docente_id, salon_id);
 i   ALTER TABLE ONLY asistenciaqr.docentes_salones DROP CONSTRAINT docentes_salones_docente_id_salon_id_key;
       asistenciaqr                 postgres    false    225    225            �           2606    16524 &   docentes_salones docentes_salones_pkey 
   CONSTRAINT     j   ALTER TABLE ONLY asistenciaqr.docentes_salones
    ADD CONSTRAINT docentes_salones_pkey PRIMARY KEY (id);
 V   ALTER TABLE ONLY asistenciaqr.docentes_salones DROP CONSTRAINT docentes_salones_pkey;
       asistenciaqr                 postgres    false    225            �           2606    16545 -   fechas_asistencia fechas_asistencia_fecha_key 
   CONSTRAINT     o   ALTER TABLE ONLY asistenciaqr.fechas_asistencia
    ADD CONSTRAINT fechas_asistencia_fecha_key UNIQUE (fecha);
 ]   ALTER TABLE ONLY asistenciaqr.fechas_asistencia DROP CONSTRAINT fechas_asistencia_fecha_key;
       asistenciaqr                 postgres    false    227            �           2606    16543 (   fechas_asistencia fechas_asistencia_pkey 
   CONSTRAINT     l   ALTER TABLE ONLY asistenciaqr.fechas_asistencia
    ADD CONSTRAINT fechas_asistencia_pkey PRIMARY KEY (id);
 X   ALTER TABLE ONLY asistenciaqr.fechas_asistencia DROP CONSTRAINT fechas_asistencia_pkey;
       asistenciaqr                 postgres    false    227            �           2606    16502    salones salones_pkey 
   CONSTRAINT     X   ALTER TABLE ONLY asistenciaqr.salones
    ADD CONSTRAINT salones_pkey PRIMARY KEY (id);
 D   ALTER TABLE ONLY asistenciaqr.salones DROP CONSTRAINT salones_pkey;
       asistenciaqr                 postgres    false    221            �           2606    16495    usuarios usuarios_correo_key 
   CONSTRAINT     _   ALTER TABLE ONLY asistenciaqr.usuarios
    ADD CONSTRAINT usuarios_correo_key UNIQUE (correo);
 L   ALTER TABLE ONLY asistenciaqr.usuarios DROP CONSTRAINT usuarios_correo_key;
       asistenciaqr                 postgres    false    219            �           2606    16493    usuarios usuarios_pkey 
   CONSTRAINT     Z   ALTER TABLE ONLY asistenciaqr.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);
 F   ALTER TABLE ONLY asistenciaqr.usuarios DROP CONSTRAINT usuarios_pkey;
       asistenciaqr                 postgres    false    219            �           2606    16513    alumnos alumnos_salon_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY asistenciaqr.alumnos
    ADD CONSTRAINT alumnos_salon_id_fkey FOREIGN KEY (salon_id) REFERENCES asistenciaqr.salones(id);
 M   ALTER TABLE ONLY asistenciaqr.alumnos DROP CONSTRAINT alumnos_salon_id_fkey;
       asistenciaqr               postgres    false    4782    221    223            �           2606    16556 $   asistencia asistencia_alumno_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY asistenciaqr.asistencia
    ADD CONSTRAINT asistencia_alumno_id_fkey FOREIGN KEY (alumno_id) REFERENCES asistenciaqr.alumnos(id);
 T   ALTER TABLE ONLY asistenciaqr.asistencia DROP CONSTRAINT asistencia_alumno_id_fkey;
       asistenciaqr               postgres    false    229    4786    223            �           2606    16561 #   asistencia asistencia_fecha_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY asistenciaqr.asistencia
    ADD CONSTRAINT asistencia_fecha_id_fkey FOREIGN KEY (fecha_id) REFERENCES asistenciaqr.fechas_asistencia(id);
 S   ALTER TABLE ONLY asistenciaqr.asistencia DROP CONSTRAINT asistencia_fecha_id_fkey;
       asistenciaqr               postgres    false    227    4794    229            �           2606    16566 )   asistencia asistencia_registrado_por_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY asistenciaqr.asistencia
    ADD CONSTRAINT asistencia_registrado_por_fkey FOREIGN KEY (registrado_por) REFERENCES asistenciaqr.usuarios(id);
 Y   ALTER TABLE ONLY asistenciaqr.asistencia DROP CONSTRAINT asistencia_registrado_por_fkey;
       asistenciaqr               postgres    false    229    219    4780            �           2606    16527 1   docentes_salones docentes_salones_docente_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY asistenciaqr.docentes_salones
    ADD CONSTRAINT docentes_salones_docente_id_fkey FOREIGN KEY (docente_id) REFERENCES asistenciaqr.usuarios(id);
 a   ALTER TABLE ONLY asistenciaqr.docentes_salones DROP CONSTRAINT docentes_salones_docente_id_fkey;
       asistenciaqr               postgres    false    219    4780    225            �           2606    16532 /   docentes_salones docentes_salones_salon_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY asistenciaqr.docentes_salones
    ADD CONSTRAINT docentes_salones_salon_id_fkey FOREIGN KEY (salon_id) REFERENCES asistenciaqr.salones(id);
 _   ALTER TABLE ONLY asistenciaqr.docentes_salones DROP CONSTRAINT docentes_salones_salon_id_fkey;
       asistenciaqr               postgres    false    225    221    4782            [   |   x���v
Q���WH,�,.I�K�L,,�K�)���/Vs�	uV�0�QPw�KT�/*J-V��4P���4UӚ˓X����}J3��o�M��fD�a�@���y)E�
�W��3F1�� &RF�      a   
   x���          ]   C   x���v
Q���WH,�,.I�K�L,,�K�ON�+I-�/N���K-Vs�	uV�0�Q !Mk... �d      _   
   x���          Y   ]   x���v
Q���WH,�,.I�K�L,,�+N���K-Vs�	uV�0�QP(��M-�Wp:��839_�QS$K-.H-*���W״��� c1"B      W   �  x���͎�@��>g��F3��A�����(�R�R�|�~�y_l�N:�¤3wQ����$_�3�����f�gs0%i�cD�)��4�	a)(�?q���Q��H��%�S�B�p��'�"�#��a��f�7m��nG�=ըh��]�%�7�ЗTo��OT�[a�bg�X,�$>��纵|Ӽ���՚}B�m�͈SY��ꃀ$!����m�<Y)� �;S�Л�kK��=ߗ����uF���c-ug�_��%Š6�	�4�|�U�}W�Si�^�xF����W`���e����)����7sy¢����t��
��� ��ޱZ=�=�ǈ�� *�o�����
#ܱ8�풌�Z�2�����^|���L�3��t@]]AH�����r\�N�a�)���󦿼g]%��\�S��qFC����ԩ�[����     