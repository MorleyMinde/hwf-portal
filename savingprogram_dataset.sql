DROP FUNCTION createWaterPoint(VARCHAR,VARCHAR,VARCHAR,VARCHAR);

CREATE OR REPLACE FUNCTION createWaterPoint(name VARCHAR, parent VARCHAR,user_id VARCHAR,jdVL0UuPB5h VARCHAR) RETURNS VARCHAR AS $$
DECLARE
	_c text;
	parent_code character varying(50);
	parent_path character varying(255);
	parent_id integer;
	number_of_water_points integer;
	results VARCHAR;
	org_unit_uid character varying(11) := uid();
	org_unit_id integer;
	dataSetUID VARCHAR := 'MTAVidYwh6V';
	programUID VARCHAR := 'lg2nRxyEtiH';
BEGIN

	BEGIN

		RAISE INFO '::::::::::::::::::::::::::::::::::::::::::::::::::::';
		RAISE INFO ':::::::: starting creation process :::::::::::::::::';
		RAISE INFO '::::::::::::::::::::::::::::::::::::::::::::::::::::';
		SELECT  organisationunit.organisationunitid,organisationunit.code,organisationunit.path INTO parent_id,parent_code,parent_path FROM organisationunit WHERE uid = parent;

		SELECT  count(organisationunit.organisationunitid) INTO number_of_water_points FROM organisationunit WHERE parentid = parent_id;
		number_of_water_points = number_of_water_points + 1;

    RAISE INFO 'Code:%',parent_path||'/'||org_unit_uid
    --Insert the organisation units;
		INSERT INTO organisationunit (organisationunitid,uid,code,created,lastupdated,name,shortname,parentid,path,userid,openingdate) VALUES((SELECT MAX(organisationunitid) + 1 FROM organisationunit),org_unit_uid,parent_code || number_of_water_points,now(),now(),name,name,parent_id,parent_path||'/'||org_unit_uid,(SELECT userinfoid FROM userinfo WHERE uid = user_id),'2000-01-01');
		RAISE INFO 'Parent ID:% Parent Code:% Number of WaterPoints:% UID:%',parent_id,parent_code,number_of_water_points,org_unit_uid;

    SELECT  organisationunit.organisationunitid INTO org_unit_id FROM organisationunit WHERE uid = org_unit_uid;


    --creating the attribute values;
    --TODO here is where the loop to go through all the attribute goes;


    SELECT insertAttributeValue(org_unit_id,'jdVL0UuPB5h',jdVL0UuPB5h);
    --SELECT insertAttributeValue(org_unit_id,'jdVL0UuPB5h',jdVL0UuPB5h);
    --SELECT insertAttributeValue(org_unit_id,'jdVL0UuPB5h',jdVL0UuPB5h);
    --SELECT insertAttributeValue(org_unit_id,'jdVL0UuPB5h',jdVL0UuPB5h);

    -- Assigning to dataset
    INSERT INTO datasetsource (datasetid, sourceid)VALUES ((SELECT datasetid FROM dataset WHERE uid = dataSetUID),(SELECT organisationunitid FROM organisationunit WHERE uid = org_unit_id));

    -- Assigning to program
    INSERT INTO program_organisationunits (programid, organisationunitid)VALUES ((SELECT programid FROM program WHERE uid = programUID),(SELECT organisationunitid FROM organisationunit WHERE uid = org_unit_id));

		RAISE INFO '::::::::::::::::::::::::::::::::::::::::::::::::::::';
		RAISE INFO ':::::::: 	The end, Bye!!!!!!!!!! :::::::::::::::::';
		RAISE INFO '::::::::::::::::::::::::::::::::::::::::::::::::::::';

		results := 'success';


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

/*
 call delete function by pass orgunit id  text, text, text,MMhip91li8h text,iLKwCl3Od9c text,rqlTarZRu8L text,koixPT9d3Sr text,FzlzchJ2J7S
*/
SELECT createWaterPoint('New Organisation Unit','DIiS6nXfTtQ','BZB2SLt3ylj','COWSO');


