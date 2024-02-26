const { connectToDatabase } = require("../../db/dbConnector");
const { z } = require("zod");

exports.handler = async (event) => {
	const equipmentDetails = JSON.parse(event.body);
	const org_id = "482d8374-fca3-43ff-a638-02c8a425c492";
	const currentTimestamp = new Date().toISOString();

	const requestBodySchema = z.array(z.object({
        owner: z.boolean({
			required_error: "isActive is required",
			invalid_type_error: "isActive must be a boolean",
		}),
        device_type_id: z.number().int(),
        manufacturer: z.string(),
        serial_number: z.string(),
        note: z.string(),
        supply_date: z.string().datetime(),
        emp_id: z.string().uuid()
    }));

    const result = requestBodySchema.safeParse(equipmentDetails);
	if (!result.success) {
		return {
			statusCode: 400,
			headers: {
				'Access-Control-Allow-Origin': '*',
      			'Access-Control-Allow-Credentials': true,
			},
			body: JSON.stringify({
				error: result.error.formErrors.fieldErrors,
			}),
		};
	}
	const addEquipmentQuery = {
                name: "add-equipment",
        		text: `
                        INSERT INTO equipment 
                            (owner, device_type_id, manufacturer, serial_number, note, supply_date, emp_id)
                        VALUES ($1, $2, $3, $4, $5, $6, $7)
                        RETURNING *
                        `,
	};
	const client = await connectToDatabase();
	await client.query("BEGIN");
	try {
        const insertedEquipment = []
		for (const equipment of equipmentDetails) {
            const addEquipmentQueryResult = await client.query(
                addEquipmentQuery,
                [
                    equipment.owner,
                    equipment.device_type_id,
                    equipment.manufacturer,
                    equipment.serial_number,
                    equipment.note,
                    equipment.supply_date,
                    equipment.emp_id,
                ]
            );
             insertedEquipment.push (addEquipmentQueryResult.rows[0]);
        }

		await client.query("COMMIT");
		return {
			statusCode: 200,
			headers: {
				'Access-Control-Allow-Origin': '*',
      			'Access-Control-Allow-Credentials': true,
			},
			body: JSON.stringify(
				insertedEquipment),
		};
	} catch (error) {
		await client.query("ROLLBACK");
		return {
			statusCode: 500,
			headers: {
				'Access-Control-Allow-Origin': '*',
      '			Access-Control-Allow-Credentials': true,
			},
			body: JSON.stringify({
				message: error.message,
				error: error,
			}),
		};
	} finally {
		await client.end();
	}
};
