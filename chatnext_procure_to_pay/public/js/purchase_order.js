frappe.ui.form.on('Purchase Order', {
    onload: function (frm) {
        // Check if the Purchase Order is not submitted
        if (frm.doc.docstatus === 0) {  // 0 indicates draft, not submitted
            // Loop through all the items in the Purchase Order
            frm.doc.items.forEach(function (item) {
                if (item.material_request) {
                    // Fetch both custom_line_of_business and custom_cost_centre from the linked Material Request
                    frappe.call({
                        method: 'frappe.client.get_value',
                        args: {
                            'doctype': 'Material Request',
                            'fieldname': ['custom_line_of_business', 'custom_cost_centre'],
                            'filters': {
                                'name': item.material_request
                            }
                        },
                        callback: function (r) {
                            if (r.message) {
                                // Set the fetched value into the cost_center field
                                if (r.message.custom_line_of_business) {
                                    frm.set_value('cost_center', r.message.custom_line_of_business);
                                }
                                // Set the fetched value into the segment field
                                if (r.message.custom_cost_centre) {
                                    frm.set_value('segment', r.message.custom_cost_centre);
                                }
                            }
                        }
                    });
                }
            });
        }
        frm.set_query("custom_cc", function () {
            return {
                "filters": {
                    "is_group": 1
                }
            };
        });
        frm.set_query("set_warehouse", function () {
            return {
                "filters": {
                    'parent_warehouse': frm.doc.custom_group_warehouse,
                    "is_group": 0,
                }
            };
        });

        frm.set_query("custom_group_warehouse", function () {
            return {
                "filters": {
                    "is_group": 1,
                }
            };
        });

        // Set query for segment field
        frm.set_query("segment", function () {
            return {
                "filters": {
                    'parent_segment': frm.doc.custom_cc,
                    "is_group": 0,
                    "disable": 0

                }
            };
        });
        console.log('Purchase Order form refreshed');

        // Remove the existing 'Payment Request' button
        frm.page.remove_inner_button('Payment Request', 'Create');

        // Add a new 'Payment Request' button with custom behavior
        frm.page.add_inner_button(__('Payment Request'), function () {
            console.log('Payment Request button clicked');
            frappe.call({
                method: 'erpnext.accounts.doctype.payment_request.payment_request.make_payment_request',
                args: {
                    dt: 'Purchase Order',
                    dn: frm.doc.name
                },
                callback: function (response) {
                    console.log('Payment Request created', response);
                    if (response.message) {
                        var payment_request = frappe.model.sync(response.message)[0];

                        // Ensure custom_payment_schedule exists
                        if (!payment_request.custom_payment_schedule) {
                            payment_request.custom_payment_schedule = [];
                        }

                        // Variable to accumulate the total advance payment amount
                        var total_advance_payment = 0;

                        // Function to process each schedule item
                        function processScheduleItem(schedule, callback) {
                            var custom_schedule = frappe.model.add_child(payment_request, 'Custom Payment Schedule', 'custom_payment_schedule');
                            custom_schedule.payment_term = schedule.payment_term;
                            custom_schedule.due_date = schedule.due_date;
                            custom_schedule.invoice_portion = schedule.invoice_portion;
                            custom_schedule.payment_amount = schedule.payment_amount;
                            custom_schedule.description = schedule.description;

                            // Check if the payment term is an advance
                            frappe.db.get_value('Payment Term', schedule.payment_term, 'custom_is_advance', function (value) {
                                if (value && value.custom_is_advance) {
                                    total_advance_payment += schedule.payment_amount;
                                }
                                callback();
                            });
                        }

                        // Copy payment_schedule data to custom_payment_schedule in Payment Request
                        if (frm.doc.payment_schedule && frm.doc.payment_schedule.length > 0) {
                            console.log('Copying payment schedule to custom payment schedule');
                            let processed_count = 0;

                            frm.doc.payment_schedule.forEach(function (schedule) {
                                processScheduleItem(schedule, function () {
                                    processed_count++;
                                    if (processed_count === frm.doc.payment_schedule.length) {
                                        // All items processed, print the total advance payment
                                        console.log('Total Advance Payment:', total_advance_payment);

                                        // Set the grand_total field in Payment Request
                                        payment_request.grand_total = total_advance_payment;

                                        // Convert grand_total to words
                                        payment_request.custom_in_words = numberToWords(total_advance_payment);

                                        // Save the Payment Request and update additional fields
                                        frappe.call({
                                            method: 'frappe.client.save',
                                            args: {
                                                doc: payment_request
                                            },
                                            callback: function (save_response) {
                                                console.log('Payment Request saved', save_response);

                                                // Update additional fields
                                                frappe.call({
                                                    method: 'frappe.client.set_value',
                                                    args: {
                                                        doctype: 'Payment Request',
                                                        name: payment_request.name,
                                                        fieldname: 'reference_doctype',
                                                        value: 'Purchase Order'
                                                    },
                                                    callback: function () {
                                                        frappe.call({
                                                            method: 'frappe.client.set_value',
                                                            args: {
                                                                doctype: 'Payment Request',
                                                                name: payment_request.name,
                                                                fieldname: 'party_type',
                                                                value: 'Supplier'
                                                            },
                                                            callback: function () {
                                                                frappe.call({
                                                                    method: 'frappe.client.set_value',
                                                                    args: {
                                                                        doctype: 'Payment Request',
                                                                        name: payment_request.name,
                                                                        fieldname: 'payment_request_type',
                                                                        value: 'Outward'
                                                                    },
                                                                    callback: function () {
                                                                        // Set the party field to the supplier value from the Purchase Order
                                                                        frappe.call({
                                                                            method: 'frappe.client.set_value',
                                                                            args: {
                                                                                doctype: 'Payment Request',
                                                                                name: payment_request.name,
                                                                                fieldname: 'party',
                                                                                value: frm.doc.supplier
                                                                            },
                                                                            callback: function () {
                                                                                // Redirect to the Payment Request form
                                                                                frappe.set_route('Form', payment_request.doctype, payment_request.name);
                                                                            }
                                                                        });
                                                                    }
                                                                });
                                                            }
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            });
                        }
                    } else {
                        console.error('Failed to create Payment Request');
                    }
                }
            });
        }, 'Create');
    },
    validate: function (frm) {
        // Check if the Purchase Order is already submitted
        if (frm.doc.docstatus === 1) {  // 1 indicates submitted
            frappe.msgprint(__('Cannot update segment after submission.'));
            frappe.validated = false;
        }
    },
    cost_center: function (frm) {
        let Segment = frm.doc.cost_center;

        frm.doc.items.forEach(function (item) {
            item.cost_center = Segment;
        });
    },
    custom_group_warehouse: function (frm) {

        let group_warehouse = frm.doc.custom_group_warehouse;


        frm.doc.items.forEach(function (item) {
            item.custom_group_warehouse = group_warehouse;
        });


        frm.refresh_field('items');
    },
    segment: function (frm) {
        let customCostCentre = frm.doc.segment;

        frm.doc.items.forEach(function (item) {
            item.segment = customCostCentre;
        });
    },

    custom_cc: function (frm) {
        let customCC = frm.doc.custom_cc;

        frm.doc.items.forEach(function (item) {
            item.custom_parent_cost_center = customCC;
        });
    },

    refresh: function (frm) {
        // Ensure the items table is updated when the form is refreshed
        if (frm.doc.segment) {
            frm.doc.items.forEach(function (item) {
                item.segment = frm.doc.segment;
            });
        }

        if (frm.doc.custom_cc) {
            frm.doc.items.forEach(function (item) {
                item.custom_parent_cost_center = frm.doc.custom_cc;
            });
        }

        frm.refresh_field('items');
        function generateItemRows(items) {
            let rows = '';
            if (items && items.length > 0) {
                items.forEach(function (item) {
                    rows += `
                        <tr>
                            <td>${item.item_code}</td>
                            <td>${item.item_name}</td>
                            <td>${item.qty}</td>
                            <td>${item.rate}</td>
                            <td>${item.amount}</td>
                        </tr>
                        `;
                });
            } else {
                rows += `
                    <tr>
                        <td colspan="5">No items available.</td>
                    </tr>
                    `;
            }
            return rows;
        }

        // Function to generate the summary rows (total amount, taxes, grand total, amount in words)
        function generateSummaryRows(doc) {
            return `
                <tr>
                    <td colspan="4" style="text-align:right;"><strong>Total Amount:</strong></td>
                    <td>${doc.total || '0.00'}</td>
                </tr>
                <tr>
                    <td colspan="4" style="text-align:right;"><strong>Total Taxes and Charges:</strong></td>
                    <td>${doc.total_taxes_and_charges || '0.00'}</td>
                </tr>
                <tr>
                    <td colspan="4" style="text-align:right;"><strong>Grand Total:</strong></td>
                    <td>${doc.grand_total || '0.00'}</td>
                </tr>
                <tr>
                    <td colspan="5" style="text-align:left;"><strong>Amount in Words &nbsp;:&nbsp;&nbsp; ${doc.in_words || 'Zero'}</strong></td>
                    
                </tr>
                `;
        }

        // Main HTML content for the custom Purchase Order section
        let table_html = `
            <style>
                .custom-purchase-order-info {
                    margin: 20px 0;
                    font-family: Arial, sans-serif;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    padding: 10px;
                    background-color: #f4f4f4;
                }
                .custom-purchase-order-info h3 {
                    margin: 0;
                    padding: 10px;
                    background-color: white;
                    color: black;
                    border-radius: 5px; 
                    font-size: 16px;
                    text-align: center;
                }
                .custom-purchase-order-details {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    margin: 10px 0;
                }
                .custom-purchase-order-detail {
                    flex: 1;
                    min-width: 200px;
                    padding: 10px;
                    background-color: white;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .custom-purchase-order-detail p {
                    margin: 5px 0;
                    font-size: 14px;
                }
                .custom-purchase-order-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 10px;
                }
                .custom-purchase-order-table th, .custom-purchase-order-table td {
                    padding: 10px;
                    text-align: left;
                    border: 1px solid #ddd;
                }
                .custom-purchase-order-table th {
                    background-color: #f4f4f4;
                    color: #333;
                    font-weight: bold;
                }
                .custom-purchase-order-table tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
                .custom-purchase-order-table tr:hover {
                    background-color: #e0e0e0;
                }
            </style>

            <div class="custom-purchase-order-info">
                <h3>Summary</h3>
                <div class="custom-purchase-order-details">
                    <div class="custom-purchase-order-detail">
                        <p><strong>Purchase Order Number:</strong> ${frm.doc.name || 'N/A'}</p>
                    </div>
                    <div class="custom-purchase-order-detail">
                        <p><strong>Date:</strong> ${frm.doc.transaction_date || 'N/A'}</p>
                    </div>
                    <div class="custom-purchase-order-detail">
                        <p><strong>Created By:</strong> ${frm.doc.owner || 'N/A'}</p>
                    </div>
                    <div class="custom-purchase-order-detail">
                        <p><strong>Workflow State:</strong> ${frm.doc.workflow_state || 'N/A'}</p>
                    </div>
                </div>
            </div>

            <table class="custom-purchase-order-table">
                <thead>
                    <tr>
                        <th>Item Code</th>
                        <th>Item Name</th>
                        <th>Quantity</th>
                        <th>Rate</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${generateItemRows(frm.doc.items)}
                    ${generateSummaryRows(frm.doc)}
                </tbody>
            </table>
            `;

        // Insert the generated HTML into the custom field
        frm.fields_dict.custom_custom_table.$wrapper.html(table_html);
    },
    custom_cc: function (frm) {
        frm.set_query("segment", function () {
            return {
                "filters": {
                    'parent_segment': frm.doc.custom_cc,
                    "is_group": 0,
                    "disable": 0
                }
            };
        });

        console.log("custom_cc field changed, query set for segment field with parent_segment:", frm.doc.custom_cc);
    },

    item_group: function (frm) {
        frm.set_query("segment", function () {
            return {
                "filters": {
                    'parent_segment': frm.doc.custom_cc,
                    "is_group": 0,
                    "disable": 0
                }
            };
        });

        console.log("item_group changed, query set for segment field");
        frm.set_query("set_warehouse", function () {
            return {
                "filters": {
                    'parent_warehouse': frm.doc.custom_group_warehouse,
                    "is_group": 0,
                }
            };
        });
    }
});


// Function to convert numbers to words
function numberToWords(amount) {
    const units = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const thousands = ['Thousand', 'Lakh', 'Crore'];

    function convertLessThanThousand(num) {
        let words = '';
        if (num % 100 < 20) {
            words = (num % 100 < 10 ? units[num % 100] : teens[num % 100 - 10]);
            num = Math.floor(num / 100);
        } else {
            words = (num % 10 !== 0 ? units[num % 10] : '');
            num = Math.floor(num / 10);
            words = (tens[num % 10 - 2] + ' ' + words).trim();
            num = Math.floor(num / 10);
        }
        if (num === 0) return words;
        return units[num] + ' Hundred ' + words;
    }

    let amountInWords = '';
    if (amount === 0) return 'Zero';

    amountInWords = convertLessThanThousand(amount % 1000);
    amount = Math.floor(amount / 1000);

    let i = 0;
    while (amount > 0) {
        let chunk = amount % 100;
        if (chunk !== 0) {
            amountInWords = convertLessThanThousand(chunk) + ' ' + thousands[i] + ' ' + amountInWords;
        }
        amount = Math.floor(amount / 100);
        i++;
    }

    return amountInWords.trim();
}

