DROP FUNCTION  insertAttributeValue(integer,VARCHAR,VARCHAR);
CREATE OR REPLACE FUNCTION insertAttributeValue(org_unit_id integer,attribute_uid VARCHAR,attribute_value VARCHAR) RETURNS VARCHAR AS $$
DECLARE
	_c text;
	attribute_value_id integer;
	results VARCHAR := 'success';
BEGIN
	BEGIN

		attribute_value_id = (SELECT MAX(attributevalueid) + 1 FROM attributevalue);

    INSERT INTO attributevalue(attributevalueid,created,lastupdated,value,attributeid) VALUES (attribute_value_id,now(),now(),attribute_value,(SELECT attributeid FROM attribute WHERE uid = attribute_uid));

    INSERT INTO organisationunitattributevalues(organisationunitid,attributevalueid) VALUES (org_unit_id,attribute_value_id);

		--results := 'success';


	EXCEPTION WHEN OTHERS THEN
		GET STACKED DIAGNOSTICS _c = PG_EXCEPTION_CONTEXT;
		RAISE NOTICE 'context: >>%<<', _c;
		raise notice '% %', SQLERRM, SQLSTATE;
		results := CONCAT('Fail to insert  : ',_c);
	END;

	RETURN results;

END;
$$
LANGUAGE plpgsql;

DROP FUNCTION  updateAttributeValue(integer,VARCHAR,VARCHAR);
CREATE OR REPLACE FUNCTION updateAttributeValue(org_unit_id integer,attribute_uid VARCHAR,attribute_value VARCHAR) RETURNS VARCHAR AS $$
DECLARE
	_c text;
	results VARCHAR := 'success';
BEGIN
	BEGIN
		--results := 'success';
    UPDATE attributevalue SET value = attribute_value WHERE attributeid = (SELECT attributeid FROM attribute WHERE uid = attribute_uid) AND attributevalueid IN (SELECT attributevalueid FROM organisationunitattributevalues WHERE organisationunitid = org_unit_id);

	EXCEPTION WHEN OTHERS THEN
		GET STACKED DIAGNOSTICS _c = PG_EXCEPTION_CONTEXT;
		RAISE NOTICE 'context: >>%<<', _c;
		raise notice '% %', SQLERRM, SQLSTATE;
		results := CONCAT('Fail to insert  : ',_c);
	END;

	RETURN results;

END;
$$
LANGUAGE plpgsql;

DROP FUNCTION createWaterPoint(VARCHAR,VARCHAR,VARCHAR,VARCHAR,VARCHAR,VARCHAR);
CREATE OR REPLACE FUNCTION createWaterPoint(water_point_name VARCHAR, parent VARCHAR,user_id VARCHAR,attributes VARCHAR,waterpoint_uid VARCHAR,orgunit_coordinates VARCHAR) RETURNS VARCHAR AS $$
DECLARE
	_c text;
	parent_code character varying(50);
	parent_path character varying(255);
	parent_id integer;
	number_of_water_points integer;
	results VARCHAR;
	org_unit_uid character varying(11) := uid();
	org_unit_id integer;
	attr VARCHAR;
	dataSetUID VARCHAR := 'MTAVidYwh6V';
	programUID VARCHAR := 'lg2nRxyEtiH';
BEGIN
	BEGIN

		SELECT  organisationunit.organisationunitid,organisationunit.code,organisationunit.path INTO parent_id,parent_code,parent_path FROM organisationunit WHERE uid = parent;
    CASE
      WHEN char_length(waterpoint_uid) <> 11 THEN
        SELECT  count(organisationunit.organisationunitid) INTO number_of_water_points FROM organisationunit WHERE parentid = parent_id;
        number_of_water_points = number_of_water_points + 1;
        --Insert the organisation units;
        INSERT INTO organisationunit (organisationunitid,uid,code,created,lastupdated,name,shortname,parentid,path,userid,openingdate,coordinates) VALUES((SELECT MAX(organisationunitid) + 1 FROM organisationunit),org_unit_uid,parent_code || number_of_water_points,now(),now(),water_point_name,water_point_name,parent_id,parent_path||'/'||org_unit_uid,(SELECT userinfoid FROM userinfo WHERE uid = user_id),'2000-01-01','[' || replace(replace(orgunit_coordinates,'dot','.'),'comma',',') || ']');

        SELECT  organisationunit.organisationunitid INTO org_unit_id FROM organisationunit WHERE uid = org_unit_uid;
      WHEN  char_length(waterpoint_uid) = 11 THEN
        org_unit_uid = waterpoint_uid;
        UPDATE organisationunit SET lastupdated = now(),name = water_point_name,shortname = water_point_name,parentid = parent_id,path = parent_path||'/'||org_unit_uid, coordinates = '[' || replace(replace(orgunit_coordinates,'dot','.'),'comma',',') || ']' WHERE uid = waterpoint_uid;
      ELSE

    END CASE;


    CASE
      WHEN char_length(waterpoint_uid) <> 11 THEN
        FOREACH attr IN array string_to_array(attributes, '-_') LOOP
             SELECT insertAttributeValue(org_unit_id,(string_to_array(attr,'_-'))[1],(string_to_array(attr,'_-'))[2]) INTO results;
        END LOOP;

            -- Assigning to dataset
        INSERT INTO datasetsource (datasetid, sourceid)VALUES ((SELECT datasetid FROM dataset WHERE uid = dataSetUID),org_unit_id);

            -- Assigning to program
        INSERT INTO program_organisationunits (programid, organisationunitid)VALUES ((SELECT programid FROM program WHERE uid = programUID),org_unit_id);
      WHEN char_length(waterpoint_uid) = 11 THEN
        FOREACH attr IN array string_to_array(attributes, '-_') LOOP
          SELECT updateAttributeValue(org_unit_id,(string_to_array(attr,'_-'))[1],(string_to_array(attr,'_-'))[2]) INTO results;
        END LOOP;
      ELSE

    END CASE;
    --creating the attribute values;
    --TODO here is where the loop to go through all the attribute goes;

		results := org_unit_uid;


	EXCEPTION WHEN OTHERS THEN
		GET STACKED DIAGNOSTICS _c = PG_EXCEPTION_CONTEXT;
		CASE
      WHEN SQLERRM = 'duplicate key value violates unique constraint "organisationunit_code_key"' THEN
        results := 'Duplicate code. Failed to generated code since it already exists.';
      ELSE
        raise notice '% %', SQLERRM, SQLSTATE;
        results := 'saving_water_point sql view error.';
      END CASE;
	END;

	RETURN results;

END;
$$
LANGUAGE plpgsql;
/*
 call delete function by pass orgunit id  text, text, text,MMhip91li8h text,iLKwCl3Od9c text,rqlTarZRu8L text,koixPT9d3Sr text,FzlzchJ2J7S
*/
--SELECT createWaterPoint('New Organisation Unit','DIiS6nXfTtQ','BZB2SLt3ylj','COWSO');

SELECT createWaterPoint('sdkfhskdg','m6UTruihEDP','m6UTruihEDP','vHgnIA6Wcc5_-Internal-_FzlzchJ2J7S_-Gravity-_iLKwCl3Od9c_-Project%201-_YtHLfazAtC1_-Project%201-_ktuyhosn1zt_-Dam-_rqlTarZRu8L_-Other-_MMhip91li8h_-30-_jdVL0UuPB5h_-COWSO-_koixPT9d3Sr_-1917','','-6dot369comma34dot8888');


