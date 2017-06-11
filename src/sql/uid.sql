CREATE OR REPLACE FUNCTION insertAttributeValue(org_unit_id integer,attribute_uid VARCHAR,attribute_value VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
	attribute_value_id integer;
BEGIN
    attribute_value_id = (SELECT MAX(attributevalueid) + 1 FROM attributevalue);

    RAISE INFO 'INSERT INTO attributevalue(attributevalueid,created,lastupdated,value,attributeid) VALUES (%,now(),now(),''%'',(SELECT attributeid FROM attribute WHERE uid = ''jdVL0UuPB5h''))',attribute_value_id,attribute_value;

    INSERT INTO attributevalue(attributevalueid,created,lastupdated,value,attributeid) VALUES (attribute_value_id,now(),now(),attribute_value,(SELECT attributeid FROM attribute WHERE uid = attribute_uid));

        RAISE INFO 'INSERT INTO organisationunit(organisationunitid,attributevalueid) VALUES (%,%)',org_unit_id,attribute_value_id;
    INSERT INTO organisationunitattributevalues(organisationunitid,attributevalueid) VALUES (org_unit_id,attribute_value_id);
 END
$$ LANGUAGE sql;
