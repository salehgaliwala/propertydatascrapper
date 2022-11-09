const puppeteer = require('puppeteer');
const TodoDao = require("./Dao/TodoDao");
const todoDao = new TodoDao();
const log = require('log-to-file');
const  moment = require('moment');


const dailyScrap = async () => {

    log('scrapping started');

    const browser  = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox']
    });

    const page  = await browser.newPage();

    await page.setViewport({width : 1366, height : 768});

    let base_url = 'https://apps.larimer.org/publictrustee/search/';

    let count = 1;
    try {
        while ( await todoDao.get_property_to_be_fetched() ){

                let property = await todoDao.get_property_to_be_fetched();
                let propery_url = base_url + property['url'];
                var tempData;

                let property_data = {};
                property_data['id'] = property['id'];
                property_data['fc_id'] = property['fc_id'];
                property_data['url'] = property['url'];
                property_data['street'] = property['street'];
                property_data['zip'] = property['zip'];
                property_data['status'] = property['status'];

                console.log(propery_url);

                await page.goto(propery_url);

                await page.waitForSelector('#ctl00_ContentPlaceHolder1_wizDetails');

                //Step 1

                tempData = await page.evaluate(function () {

                    let temp = {};
                    temp['address'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtAddressAddress').val();
                    temp['subdivision'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtAddressSubdivision').val();
                    temp['legal_description'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtAddressLegalDescription').val();
                    temp['agricultural_property'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_chkAgriculture').prop("checked") ? '1' : '0';
                    temp['current_owner_name'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtCurrentOwnerName').val();
                    temp['current_owner_address'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtCurrentOwnerAddress').val();

                    temp['await_next'] = 1;
                    let selectClick = document.querySelector('#ctl00_ContentPlaceHolder1_wizDetails_SideBarContainer_SideBarList_ctl01_SideBarButton');
                    if(selectClick !== null) selectClick.click();
                    else temp['await_next'] = 0;


                    return temp;
                });

                property_data = {...property_data, ...tempData};

                //Step 2

                if (tempData['await_next'] === 1)
                    await page.waitFor(function () {
                        let text = document.querySelector('#ctl00_ContentPlaceHolder1_wizDetails > tbody > tr td:nth-of-type(2) table > tbody > tr td table tbody tr:nth-of-type(1) td').innerText;
                        return text === 'Bankruptcy';
                    });

                await page.waitFor(150);

                tempData = await page.evaluate(function () {

                    let temp = {};

                    temp['bankruptcy_data'] = '';
                    /*let bankruptcy_data = document.querySelector('#ctl00_ContentPlaceHolder1_wizDetails > tbody > tr td:nth-of-type(2) table > tbody > tr td table tbody tr:nth-of-type(3) td');
                    if (bankruptcy_data !== null)
                        temp['bankruptcy_data'] = bankruptcy_data.innerText;*/
                    var bankruptcy_data = document.querySelectorAll('#ctl00_ContentPlaceHolder1_wizDetails > tbody > tr td:nth-of-type(2) table > tbody > tr td table tbody tr:nth-of-type(3) td table tr:last-child td');
                    if (bankruptcy_data.length > 0){
                        var tt = '';
                        for (let x = 0; x < bankruptcy_data.length; x++) {
                            tt += bankruptcy_data[x].innerText + ' ';
                        }
                        temp['bankruptcy_data'] = tt.trim();
                    }

                    temp['temporary_restraining_orders'] = '';
                    let temporary_restraining_orders = document.querySelector('#ctl00_ContentPlaceHolder1_wizDetails > tbody > tr td:nth-of-type(2) table > tbody > tr td table tbody tr:nth-of-type(5) td');
                    if (temporary_restraining_orders !== null)
                        temp['temporary_restraining_orders'] = temporary_restraining_orders.innerText;


                    temp['await_next'] = 1;
                    let  selectClick = document.querySelector('#ctl00_ContentPlaceHolder1_wizDetails_SideBarContainer_SideBarList_ctl02_SideBarButton');
                    if(selectClick !== null) selectClick.click();
                    else temp['await_next'] = 0;

                    return temp;
                });

                property_data = {...property_data, ...tempData};

                //Step 3
                if (tempData['await_next'] === 1)
                await page.waitFor(function () {
                    return !!document.getElementById('ctl00_ContentPlaceHolder1_wizDetails_txtBasicsEADDate');
                });

                await page.waitFor(150);

                tempData = await page.evaluate(function () {

                    let temp = {};
                    temp['ned_date'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtBasicsEADDate').val();
                    temp['ned_reception'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtBasicsEADReceptionNumber').val();
                    temp['originally_scheduled_sale_date'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtBasicsOriginalSaleDate').val();
                    temp['currently_scheduled_sale_date'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtBasicsActualSaleDate').val();
                    temp['date_file_received'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtDateFileReceived').val();
                    temp['date_file_created'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtDateFileCreated').val();

                    temp['ned_rerecording_date'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtBasicsEADRecordingDate').val();
                    temp['ned_rerecording_reception'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtBasicsEADRecordingReceptionNumber').val();
                    temp['deed_of_trust_date'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtBasicsDOTDate').val();
                    temp['deed_of_trust_recorded'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtBasicsDOTRecorded').val();
                    temp['deed_of_trust_reception'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtBasicsDOTReceptionNumber').val();

                    temp['loan_type'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtBasicsLoanInfoLoanType').val();
                    temp['original_principal_balance'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtBasicsLoanInfoOriginalAmount').val();
                    temp['principal_balance_as_of_date'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtBasicsLoanInfoCurrentDate').val();
                    temp['outstanding_principal_balance'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtBasicsLoanInfoCurrentAmount').val();
                    temp['interest_rate'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtBasicsLoanInfoInterestRate').val();
                    temp['interest_type'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtBasicsLoanInfoInterestType').val();
                    temp['current_holder'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtBasicsLoanInfoCurrentLender').val();
                    temp['grantee_original_beneficiary'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtBasicsLoanInfoGrantee').val();
                    temp['original_grantor_borrower'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtBasicsLoanInfoGrantor').val();

                    temp['await_next'] = 1;
                    let  selectClick = document.querySelector('#ctl00_ContentPlaceHolder1_wizDetails_SideBarContainer_SideBarList_ctl03_SideBarButton');
                    if(selectClick !== null) selectClick.click();
                    else temp['await_next'] = 0;

                    return temp;

                });

                property_data = {...property_data, ...tempData};

                //Step 4
                if (tempData['await_next'] === 1)
                await page.waitFor(function () {
                    return !!document.getElementById('ctl00_ContentPlaceHolder1_wizDetails_txtInentDeadline');
                });

                await page.waitFor(150);

                tempData = await page.evaluate(function () {

                    let temp = {};
                    temp['cure_intent_deadline'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtInentDeadline').val();
                    temp['cure_deadline'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtCureDeadline').val();
                    temp['cured_amount_received'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtCuredAmountReceived').val();
                    temp['cured_by'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtCuredBy').val();
                    temp['date_cured'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtCuredDate').val();
                    temp['cure_figures_requested'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtCureFiguresRequested').val();

                    temp['cure_figures_received'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtCureFiguresReceived').val();
                    temp['cure_figures_expire'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtCureFiguresExpire').val();
                    temp['cure_figures_total_to_cure'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtCureFiguresTotalToCure').val();

                    temp['cure_intent_filed'] = document.querySelector('#ctl00_ContentPlaceHolder1_wizDetails > tbody > tr td:nth-of-type(2) table > tbody > tr td table tbody tr:nth-of-type(11) td').innerText;

                    temp['await_next'] = 1;
                    let  selectClick = document.querySelector('#ctl00_ContentPlaceHolder1_wizDetails_SideBarContainer_SideBarList_ctl04_SideBarButton');
                    if(selectClick !== null) selectClick.click();
                    else temp['await_next'] = 0;

                    return temp;
                });

                property_data = {...property_data, ...tempData};

                //Step 5
                if (tempData['await_next'] === 1)
                await page.waitFor(function () {
                    return !!document.getElementById('ctl00_ContentPlaceHolder1_wizDetails_txtDeedDeedToDate');
                });

                await page.waitFor(150);

                tempData = await page.evaluate(function () {

                    let temp = {};
                    temp['date_deed_recorded'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtDeedDeedToDate').val();
                    temp['deeded_to'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtDeedDeedTo').val();
                    temp['recipient_address'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtDeedRecipentAddress').val();
                    temp['deed_reception'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtDeededDeedRecptionNumber').val();

                    temp['await_next'] = 1;
                    let  selectClick = document.querySelector('#ctl00_ContentPlaceHolder1_wizDetails_SideBarContainer_SideBarList_ctl05_SideBarButton');
                    if(selectClick !== null) selectClick.click();
                    else temp['await_next'] = 0;

                    return temp;
                });

                property_data = {...property_data, ...tempData};

                //Step 6
                if (tempData['await_next'] === 1)
                await page.waitFor(function () {
                    return !!document.getElementById('ctl00_ContentPlaceHolder1_wizDetails_txtLawFirmName');
                });

                await page.waitFor(150);

                tempData = await page.evaluate(function () {

                    let temp = {};
                    temp['law_firm_name'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtLawFirmName').val();
                    temp['law_firm_file_number'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtLawFirmFileNumber').val();
                    temp['law_firm_address'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtLawFirmAddress').val();
                    temp['law_firm_telephone'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtLawFirmTelephone').val();
                    temp['law_firm_fax'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtLawFirmFax').val();
                    temp['law_firm_email'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtLawFirmEmail').val();
                    temp['law_firm_contact'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtLawFirmContact').val();

                    temp['await_next'] = 1;
                    let  selectClick = document.querySelector('#ctl00_ContentPlaceHolder1_wizDetails_SideBarContainer_SideBarList_ctl06_SideBarButton');
                    if(selectClick !== null) selectClick.click();
                    else temp['await_next'] = 0;

                    return temp;
                });

                property_data = {...property_data, ...tempData};

                //Step 7
                if (tempData['await_next'] === 1)
                await page.waitFor(function () {
                    return !!document.getElementById('ctl00_ContentPlaceHolder1_wizDetails_txtMailingsInitialCRNoticeMailed');
                });

                await page.waitFor(150);

                tempData = await page.evaluate(function () {

                    let temp = {};
                    temp['initial_rights_mailed'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtMailingsInitialCRNoticeMailed').val();
                    temp['notice_of_sale_mailing_date'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtMailingsInitialSaleNoticeMailed').val();
                    temp['amended_sale_and_rights_notice_mailed'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtMailingsMailed').val();
                    temp['deferred_combined_notice_mailed'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtDeferredCombinedNoticeMailed').val();


                    temp['mail_last_row'] = '';
                    let mail_last_row = document.querySelector('#ctl00_ContentPlaceHolder1_wizDetails > tbody > tr td:nth-of-type(2) table > tbody > tr td table tbody tr:nth-of-type(6)');
                    if (mail_last_row !== null)
                        temp['mail_last_row'] = mail_last_row.innerText;

                    temp['await_next'] = 1;
                    let  selectClick = document.querySelector('#ctl00_ContentPlaceHolder1_wizDetails_SideBarContainer_SideBarList_ctl07_SideBarButton');
                    if(selectClick !== null) selectClick.click();
                    else temp['await_next'] = 0;

                    return temp;
                });
                property_data = {...property_data, ...tempData};

                let jj = await page.evaluate(function () {
                    return  document.querySelector('#ctl00_ContentPlaceHolder1_wizDetails_SideBarContainer_SideBarList_ctl07_SideBarButton').innerText;
                });

                let side_count = 8;

                //Step 8
                if (tempData['await_next'] === 1 && jj === 'Owner Redemption') {

                    await page.waitFor(function () {
                        return !!document.getElementById('ctl00_ContentPlaceHolder1_wizDetails_txtOwnerRedemptionRedemptionTime');
                    });

                    await page.waitFor(150);

                    tempData = await page.evaluate(function (side_count) {

                        let temp = {};
                        temp['redemption_time'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtOwnerRedemptionRedemptionTime').val();
                        temp['date_intent_to_redeem_filed'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtOwnerRedemptionDateIntentToRedeemTime').val();
                        temp['after_sale_last_date_to_redeem'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtOwnerRedemptionAfterSaleLastDateToRedeem').val();
                        temp['owner_extended_last_date_to_redeem'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtOwnerRedemptionExtendedLastDateToRedeem').val();
                        temp['redeemed_date'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtOwnerRedemptionRedeemedDate').val();
                        temp['redemption_amount_due'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtOwnerRedemptionRedeemedAmount').val();
                        temp['redemption_amount_paid'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtRedemptionPaid').val();
                        temp['redemption_refund_amount'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtRedemptionRefund').val();
                        temp['certificate_of_redemption_reception'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtOwnerRedemptionCertificateOdRedemptionReceptionNumber').val();

                        temp['await_next'] = 1;

                        let sidecountstring = (side_count < 10) ? '0' + side_count.toString() : side_count.toString();
                        let selectClick = document.querySelector('#ctl00_ContentPlaceHolder1_wizDetails_SideBarContainer_SideBarList_ctl'+sidecountstring+'_SideBarButton');
                        if (selectClick !== null) selectClick.click();
                        else temp['await_next'] = 0;

                        return temp;
                    },side_count);

                    side_count++;
                }
                else {

                    let temp = {};
                    temp['await_next'] = tempData['await_next'] ;
                    temp['redemption_time'] = '';
                    temp['date_intent_to_redeem_filed'] = '';
                    temp['after_sale_last_date_to_redeem'] = '';
                    temp['owner_extended_last_date_to_redeem'] = '';
                    temp['redeemed_date'] = '';
                    temp['redemption_amount_due'] = '';
                    temp['redemption_amount_paid'] = '';
                    temp['redemption_refund_amount'] = '';
                    temp['certificate_of_redemption_reception'] = '';

                    tempData = temp;
                }

                property_data = {...property_data, ...tempData};

                //Step 9
                if (tempData['await_next'] === 1)
                await page.waitFor(function () {
                    return !!document.getElementById('ctl00_ContentPlaceHolder1_wizDetails_txtPublicationPublication');
                });

                await page.waitFor(150);

                tempData = await page.evaluate(function (side_count) {

                    let temp = {};
                    temp['published_in'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtPublicationPublication').val();
                    temp['first_publication_date'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtPublicationFirstPublicationDate').val();
                    temp['last_publication_date'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtPublicationLastPublicationDate').val();
                    temp['first_re_pub_date'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtPublicationFirstRePubDate').val();
                    temp['last_re_pub_date'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtPublicationLastRePubDate').val();
                    temp['deferred_publication_date'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtFirstDefermentPublicationDate').val();
                    temp['last_deferred_publication_date'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtLastDefermentPublicationDate').val();

                    temp['await_next'] = 1;
                    let sidecountstring = (side_count < 10) ? '0' + side_count.toString() : side_count.toString();
                    let selectClick = document.querySelector('#ctl00_ContentPlaceHolder1_wizDetails_SideBarContainer_SideBarList_ctl'+sidecountstring+'_SideBarButton');
                    if(selectClick !== null) selectClick.click();
                    else temp['await_next'] = 0;

                    return temp;
                },side_count);

                side_count++;
                property_data = {...property_data, ...tempData};


                //Step 10
                if (tempData['await_next'] === 1)
                await page.waitFor(function () {
                    return !!document.getElementById('ctl00_ContentPlaceHolder1_wizDetails_txtLienorsNoticeOfIntentToRedeemFilingDeadline');
                });

                await page.waitFor(150);

                tempData = await page.evaluate(function (side_count) {

                    let temp = {};
                    temp['notice_of_intent_to_redeem_filing_deadline'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtLienorsNoticeOfIntentToRedeemFilingDeadline').val();
                    temp['all_redemption_periods_expire'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtLienorsRedPerEnds').val();
                    temp['redemption_extended_last_date_to_redeem'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtLienorsExtendedLastDateForOwnerToRedeem').val();

                    temp['redemption_lienor_information'] = '';
                    let redemption_lienor_information = document.querySelector('#ctl00_ContentPlaceHolder1_wizDetails > tbody > tr td:nth-of-type(2) table > tbody > tr td table tbody tr:nth-of-type(6)')
                    if (redemption_lienor_information !== null)
                        temp['redemption_lienor_information'] = redemption_lienor_information.innerText;

                    temp['redemption_last_row'] = '';
                    let redemption_last_row = document.querySelector('#ctl00_ContentPlaceHolder1_wizDetails > tbody > tr td:nth-of-type(2) table > tbody > tr td table tbody tr:nth-of-type(7)')
                    if (redemption_last_row !== null)
                        temp['redemption_last_row'] = redemption_last_row.innerText;

                    temp['await_next'] = 1;
                    let sidecountstring = (side_count < 10) ? '0' + side_count.toString() : side_count.toString();
                    let selectClick = document.querySelector('#ctl00_ContentPlaceHolder1_wizDetails_SideBarContainer_SideBarList_ctl'+sidecountstring+'_SideBarButton');
                    if(selectClick !== null) selectClick.click();
                    else temp['await_next'] = 0;

                    return temp;
                },side_count);

                side_count++;
                property_data = {...property_data, ...tempData};

                //Step 11
                if (tempData['await_next'] === 1)
                await page.waitFor(function () {
                    return !!document.getElementById('ctl00_ContentPlaceHolder1_wizDetails_txtCopPendingBid');
                });

                await page.waitFor(150);

                tempData = await page.evaluate(function (side_count) {

                    let temp = {};
                    temp['holders_initial_bid'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtCopPendingBid').val();
                    temp['holder'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtCopBidderInformation').val();
                    temp['deficiency_amount'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtCopDeficiencyAmount').val();
                    temp['total_indebtedness'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtCopTotalIndebtedness').val();

                    temp['date_sold'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtCopActualSoldDate').val();
                    temp['successful_bid_at_sale'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtCopBidAmount').val();
                    temp['deficiency_amount_post_sale'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtRevisedDeficiencyAmountDuetoOutsideBid').val();
                    temp['overbid_amount'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtCopOverbidAmount').val();

                    temp['cop_issued_to'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtCOPIssuedTo').val();
                    temp['cop_issued_to_address'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtCOPIssuedToAddress').val();
                    temp['cop_assigned_to'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtCOPAssignedTo').val();
                    temp['cop_assigned_to_address'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtCOPAssignedToAddress').val();
                    temp['cop_reception'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtCopRecordedUnderReceptionNumber').val();

                    temp['await_next'] = 1;
                    let sidecountstring = (side_count < 10) ? '0' + side_count.toString() : side_count.toString();
                    let selectClick = document.querySelector('#ctl00_ContentPlaceHolder1_wizDetails_SideBarContainer_SideBarList_ctl'+sidecountstring+'_SideBarButton');
                    if(selectClick !== null) selectClick.click();
                    else temp['await_next'] = 0;

                    return temp;
                },side_count);

                side_count++;
                property_data = {...property_data, ...tempData};


                //Step 12
                if (tempData['await_next'] === 1)
                await page.waitFor(function () {
                    return !!document.getElementById('ctl00_ContentPlaceHolder1_wizDetails_txtWithdrawalToBeWithdrawnDate');
                });

                await page.waitFor(150);

                tempData = await page.evaluate(function (side_count) {

                    let temp = {};
                    temp['to_be_withdrawn_date'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtWithdrawalToBeWithdrawnDate').val();
                    temp['withdrawn_date'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtWithdrawalWithdrawnDate').val();
                    temp['withdrawn_reception'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtWithdrawalWithdrawnReceptionNumber').val();
                    temp['voided_administrative_withdrawal_recorded_date'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtWithdrawalVoidRecorded').val();
                    temp['voided_administrative_withdrawal_reception_number'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtWithdrawalVoidReceptionNumber').val();

                    temp['await_next'] = 1;
                    let sidecountstring = (side_count < 10) ? '0' + side_count.toString() : side_count.toString();
                    let selectClick = document.querySelector('#ctl00_ContentPlaceHolder1_wizDetails_SideBarContainer_SideBarList_ctl'+sidecountstring+'_SideBarButton');
                    if(selectClick !== null) selectClick.click();
                    else temp['await_next'] = 0;

                    return temp;
                },side_count);

                side_count++;
                property_data = {...property_data, ...tempData};


                //Step 13
                if (tempData['await_next'] === 1)
                await page.waitFor(function () {
                    return !!document.getElementById('ctl00_ContentPlaceHolder1_wizDetails_txtAffidavitOfPostingReceivedDate');
                });
                await page.waitFor(150);

                tempData = await page.evaluate(function (side_count) {

                    let temp = {};
                    temp['affidavit_of_posting_received_date'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtAffidavitOfPostingReceivedDate').val();
                    temp['certificate_of_qualification_received_date'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtCertificateOfQualificationReceivedDate').val();
                    temp['counselor_approved_homeowner_qualification_for_deferment_date'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtApprovedQualificationForDefermentDate').val();
                    temp['homeowner_contacted_counselor_date'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtCounselorContactedDate').val();
                    temp['deferment_terminated_date'] = jQuery('#ctl00_ContentPlaceHolder1_wizDetails_txtDefermentTerminatedDate').val();

                    return temp;
                },side_count);
                property_data = {...property_data, ...tempData};


                let timestamp = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');

                property_data['date_added'] = timestamp;
                property_data['date_updated'] = timestamp;

                await todoDao.savePropertyData(property_data);
                await page.waitFor(1500);

                console.log(property_data);
                console.log(count);

                if (count++ > 5500)
                    break;
        }
    }
    catch (ex) {
        let property = await todoDao.get_property_to_be_fetched();
        let x = await todoDao.set_property_fetch_error(property['id']);
        log(ex + ' Propery id = '+ property['id'] );
    }

    browser.close();

    log('scrapping stop');
};

dailyScrap();

