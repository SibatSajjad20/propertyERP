export interface AgreementDefinitionRow {
  term: string;
  definition: string;
}

export interface AgreementClauseSection {
  number: string;
  title: string;
  paragraphs: string[];
}

export const AGREEMENT_BANK_DETAILS = {
  bankName: "United Bank Limited (UBL)",
  accountTitle: "ASSH Developers Pvt Ltd",
  accountNo: "299201412",
  iban: "PK35 UNIL 0109 0002 9920 1412",
  swiftCode: "UNILPKKA741",
  branchCode: "0372",
  financeEmail: "finance@asshdeveloper.com",
} as const;

export const AGREEMENT_DEFINITIONS: readonly AgreementDefinitionRow[] = [
  {
    term: "Agreement",
    definition:
      "means this Agreement of Sale and Purchase along Schedules, as may be amended or supplemented by the Seller/Vendor from time to time at its sole discretion.",
  },
  {
    term: "Buyer/Vendee",
    definition:
      "means the natural or legal person or persons identified as the Buyer/Vendee in this Agreement and his/her or their respective heirs, executors, successors, nominees, successors-in-title, permitted transferees and permitted assigns. Where there is more than one Buyer, references to one Buyer/Vendee shall be to such persons jointly and severally.",
  },
  {
    term: "Common Areas",
    definition:
      "means those parts of the PROJECT not physically forming a part of any Unit and are intended for the common use of all occupants or owners of Units, including inter alia all open areas, elevators, administrative office areas, security system, lobbies, Parking Area and hallways.",
  },
  {
    term: "Common Facilities",
    definition:
      "means all roads, pavements, water features, installations, elevators, power backup equipment, security system, tube-well motors, improvements and common assets of the Common Areas that are intended for facilitating all occupants and owners of Units and do not form part of any given Unit.",
  },
  {
    term: "Government Authority",
    definition:
      "means any federal, provincial, capital or local government or authority, department, local, regulatory, statutory or housing authority, including the Office of the Cantonment Board Rawalpindi, Office of the Military Estates Officer Rawalpindi, and any other authority which has jurisdiction over any aspect or part of the Project or the Agreement.",
  },
  {
    term: "Anticipated Date of Completion",
    definition:
      "means the expected date as mentioned/incorporated in the Schedule-A of this Agreement, on which the Unit will be ready for handover of possession to the Buyer/Vendee, subject to the Buyer/Vendee complying with his/her obligations as per this Agreement.",
  },
  {
    term: "Completion Notice",
    definition:
      "means a written notice sent to the Buyer/Vendee by the Seller/Vendor communicating the Date of Completion of the Unit.",
  },
  {
    term: "Down Payment",
    definition:
      "means the amount paid by the Buyer/Vendee under this Agreement, as shown in the Payment Plan-Schedule-B.",
  },
  {
    term: "Due Date",
    definition:
      "means the date on or before which any payment or installment in the Payment Plan is required to be paid by the Buyer/Vendee to the Seller/Vendor in the designated bank account.",
  },
  {
    term: "Master Developer",
    definition: "means Rawalpindi Development Authority.",
  },
  {
    term: "Nominee",
    definition:
      "means such person, as may be nominated by the Buyer/Vendee as the person who may facilitate in the transfer of rights and obligations of the Buyer/Vendee under the Agreement to the legal heirs in the event of demise of the Buyer/Vendee.",
  },
  {
    term: "Parking Area",
    definition:
      '"Parking Area" means the demarcated parking area within the Sardars Mall Building designated for the common use of visitors and occupants of the Project (Sardars Mall). It is expressly clarified that no specific, fixed, or exclusive parking space shall be allocated or assigned to any Buyer.',
  },
  {
    term: "Parties",
    definition:
      'The Seller/Vendor and the Buyer/Vendee, where the context so permits, and each individually as a "Party".',
  },
  {
    term: "Payment Plan",
    definition:
      "means the Payment Plan in Schedule B of the Agreement, setting out the Due Date, quantum and schedule of Installment Payments of the Purchase Price to be paid by the Buyer/Vendee.",
  },
  {
    term: "Plot",
    definition: "means 54-C Iran Road, Block C, near Chandni Chowk, Rawalpindi Pakistan.",
  },
  {
    term: "Property Manager",
    definition:
      "means the entity formed by the Seller/Vendor, which may include the Seller, any of its affiliates or associated companies or any other company (and their respective successors in interest and assigns) charged with the maintenance, operation or management of the PROJECT or any part thereof, including inter alia Parking Area, Common Areas and/or Common Facilities.",
  },
  {
    term: "Project",
    definition:
      "means the multistory commercial, apartment or Office building being constructed and developed by the Seller/Vendor, named and advertised as SARDAR'S MALL approved and sanctioned by the Master Developer and/or any other relevant Government office/authority.",
  },
  {
    term: "Payment Price",
    definition:
      "means the total price including the Down Payment as well as the instalments under the Payment Plan but excludes any additional payment under the Agreement.",
  },
  {
    term: "Unit",
    definition:
      "means the specific Commercial unit/Shop, Residential Apartment or Office Space as shown in Schedule-B being the Purchased Unit, which the Buyer/Vendee has contracted to purchase pursuant to this Agreement.",
  },
  {
    term: "Rules",
    definition:
      "means such rules, as amended from time to time, as may be framed by the Seller/Vendor being the Developer and/or the Property Manager setting out the Buyer's rights and obligations in relation to the use, occupancy, layout, maintenance, design and display of the Purchased Unit.",
  },
  {
    term: "Service Charges",
    definition:
      "means the amount payable by the Buyer/Vendee to the Property Manager on monthly basis in advance as the proportionate contribution towards the management, administration, maintenance and control of the Common Areas, Common Facilities and Parking Area, which amount shall be determined and prescribed from time to time by the Property Manager provided that Service Charges shall always be reasonable, based on market standards and as per fair market rates.",
  },
  {
    term: "Taxes",
    definition:
      "means any federal, provincial or local taxes or levies payable on any component used for the construction of the Purchased Unit or, where the context permits, applicable on the sale or lease thereof, as may be prescribed or levied from time to time by any Government Authority.",
  },
];

export const AGREEMENT_CLAUSES: readonly AgreementClauseSection[] = [
  {
    number: "1",
    title: "THE PROJECT",
    paragraphs: [
      "1.1. The Buyer/Vendee acknowledges and understands that the Seller/Vendor is the Owner of the PROJECT by the name of SARDAR'S MALL and Rawalpindi Development Authority is Master Developer of the Master Community in which the PROJECT is located. The Seller/Vendor will develop the PROJECT into a homogeneous residential, commercial, Offices and retail complex with certain shared facilities, parking and amenities.",
      "1.2. The units in the PROJECT are composed of following 3 main categories:\n• **Residential Apartments (Un Furnished):** Units purely for residential purpose to be used at the reasonable discretion of the Buyer at will, either personally, or leased out, subject to the terms of the Agreement. Such residential units are not serviced.\n• **Commercial Units/Shops:** Units purely for commercial purpose for the personal use of the Buyer or to be leased out, which at all times is subject to the conditions of usage and tenancy laid out in this agreement and any conditions imposed by Seller and/ or Property Manager, as the case may be.\n• **Offices (Unfurnished):** Units purely for Office purpose to be used at the reasonable discretion of the Buyer at will, either personally, or leased out, subject to the terms of the Agreement. Such office units are unfurnished.",
      "1.3. The Buyer/Vendee acknowledges and understands that the Master Developers shall remain owner of the residual land in the Master Community and that for the proper and convenient management, administration, maintenance and control of the Master Community, mutually beneficial restrictions are imposed on all the properties in the Master Community by the Master Developer under the declaration which establishes a mutually beneficial scheme for the management, administration, maintenance and control of the Master Community.",
      '1.4. The Buyer acknowledges and understands that for the proper and convenient management of the Project, the Seller will appoint an independent Property Management firm or company, herein referred to as the "Property Manager" which shall be formed or employed and shall be deemed to be operationally established at the Project from the date on which any person other than the Seller becomes an Owner of a Property in the Project provided that at this point in time the Project has been completed in full.',
      "1.5. The Property Manager shall be responsible for the maintenance, upkeep and renovation of all common use areas within the project, as well as enforcement of all relevant by-laws along with the management of the Project, and for such purpose shall have the full management, administration, maintenance and control of the Project. The Buyer acknowledges and agrees to comply completely with the Property Manager which has the powers and functions necessary for property management, maintenance and enforcement of the provisions of this as well as the Property Management Agreement with regards to the Project for the collective benefit of all involved parties including, but not limited to, the Buyers, Owners, Occupiers, Licensing Entity, Licensees and Tenants.",
      "1.6. The Buyer/Vendee hereby agrees and understands that the Buyer/Vendee, his/her heirs, successors-in-title, permitted successors or assignees, the Seller/Vendor, and the Property Manager forming part of the Master Community as well as other property owners from time to time of any property in the Master Community shall be bound by the Declaration of adherence, by signing the Declaration of Adherence. The Buyer/Vendee acknowledges that he/she has been informed and accepts that the Declaration is subject to amendment as the Master Developer in its absolute discretion deems fit.",
    ],
  },
  {
    number: "2",
    title: "DISCLAIMERS",
    paragraphs: [
      "2.1. The Seller/Vendor and the Project Manager or their consultants shall not be responsible for any physical obstructions within the Master Community or Plot or Property.",
      "2.2. All matters pertaining to the usage, running, maintenance, upkeep and renovation etc. shall be the domain of the Property Manager/Management Firm, and the Buyer shall at all times abide by the regulations/directions notified by the Manager from time-to-time, and any and all matters pertaining to the aforementioned shall be the sole purview of the Property Manager, and the Seller shall not be liable for the same.",
    ],
  },
  {
    number: "3",
    title: "THE SALE",
    paragraphs: [
      "The Seller/Vendor hereby sells to the Buyer/Vendee who hereby purchases the Unit for Purchase Price and other payments, if any, in accordance with the terms and conditions contained in this Agreement, along with two schedules appended hereto, which shall form an integral part.",
    ],
  },
  {
    number: "4",
    title: "PURCHASE PRICE AND PAYMENT",
    paragraphs: [
      "4.1. Only one application form can be used for booking of one Unit only. Additionally, Seller/Vendor is the Sole Entity authorized to issue such bookings and recording such sales.",
      "4.2. The Buyer/Vendee undertakes to ensure that the Property Reservation Fee and on-going installments shall be paid in Pakistani Rupees (PKR) (the local currency) of the Islamic Republic of Pakistan and any short fall in payment due to the fluctuation in case of the currency exchange rate shall be on the Buyer/Vendee's account and shall be immediately rectified by the Buyer/Vendee.",
      "4.3. All Down payments and subsequent installments and or any other payments should be made according to type and size of the Unit, as per schedule of payments through bank draft/pay order/cheque in the favor of ASSH DEVELOPERS PRIVATE LTD, for which the bank account details are mentioned below;",
      `4.4. All subsequent installments for purchase of Unit shall be made in favors of developer's (the Seller/Vendor) Account, for which bank account details are mentioned below:\nBank Name: ${AGREEMENT_BANK_DETAILS.bankName}\nAccount Title: ${AGREEMENT_BANK_DETAILS.accountTitle}\nAccount: ${AGREEMENT_BANK_DETAILS.accountNo} | IBAN: ${AGREEMENT_BANK_DETAILS.iban}\nSwift Code: ${AGREEMENT_BANK_DETAILS.swiftCode} | Branch Code: ${AGREEMENT_BANK_DETAILS.branchCode}\nPlease send payment proofs and payment related queries to Developer's official Email: ${AGREEMENT_BANK_DETAILS.financeEmail}`,
      "4.5. Any and all payments from the Buyer/Vendee will only be considered as completed once the Seller/Vendor has issued a receipt voucher against the payment and furnished a receipt copy to the Buyer/Vendee which is not to be unreasonably withheld by the Seller/Vendor.",
      "4.6. The purchase price of the Property is contingent upon the current market conditions and the costs associated with the development or construction of the Property. The Seller reserves the right to reevaluate the purchase price of the Property in the event that the costs associated with the development or construction of the Property increase due to unforeseeable circumstances, including, but not limited to, increases in material or labor costs, changes in taxes or fees, or any other event that may impact the costs associated with the development of the Property. The Seller will provide the Buyer with written notice of any such reevaluation of the purchase price, which shall be deemed accepted by the Buyer if not disputed within 30 days of such notice. If the Buyer disputes the new purchase price, the parties shall negotiate in good faith to arrive at a mutually acceptable purchase price. If the parties are unable to reach an agreement within 07 days of the dispute being raised, either party may terminate this Agreement as per Clause 15.4 (below).",
      "4.7. The Buyer/Vendee must pay each installment of the purchase price on or before the dates stipulated in the Payment Schedule as detailed in Schedule-B, to the Seller/Vendor's account via cash, banker's cheques, wire transfer, money gram or any other mutually agreed upon mode of payment. If the Master Developer accelerates or changes the handing over date of the Property, the Seller reserves the right to accelerate or change the Payment Schedule and shall inform the Buyer of the revised Payment Schedule in writing, which the Buyer acknowledges and confirms he will abide by.",
      '4.8. Provided that in the case of late payment (i.e. payment of an installment after the date on which it was due), the late payment will only be accepted subject to the payment of a "late payment fee/surcharge" at the rate of 0.05% of the amount overdue per day, with the monthly late payment fee/surcharge being 1.5% of the amount overdue.',
      "4.9. Should it be the case that the Buyer defaults or fails to pay due installment(s) (along with their accrued late fee as per Clause 4.8 above) within sixty (60) days of payment(s) due date, the Seller reserves the right to cancel the allotment of the Buyer. Furthermore, in the case of default, bankruptcy, liquidation on the part of the Buyer, the Seller shall be at liberty to invoke the provisions of Clause 15 of this Agreement (below).",
    ],
  },
  {
    number: "5",
    title: "POSSESSION AND RISK",
    paragraphs: [
      "5.1. The Anticipated Completion Date represents the date upon which it is presently expected that the Unit will be ready for occupation. The Seller/Vendor reserves the right to extend the Anticipated Completion Date.",
      "5.2. The Seller/Vendor retains and reserves the right at all times to make any changes in designs and specifications to the PROJECT as required by governing bodies/entity or the Master Developer, or the licensing entity.",
      "5.3. The Buyer/Vendee is bound to submit the original receipt whenever required and particularly at the time of transfer/handing over the possession of the Unit to Buyer/Vendee by the Seller/Vendor.",
      "5.4. All common passages in the building, services/amenities and the landscaped areas shall neither be constructed upon nor inappropriately utilized and rented out by the Buyer but will be exclusively used for the purpose they are meant for in line with stipulations laid down by The Developer/Seller or the Property Manager and any persons(s) designated thereby.",
      "5.5. The Buyer/Vendee or their respective Unit tenant is liable to pay the relevant club/services charges along with any other maintenance charges for the maintenance and upkeep of the property on a per month basis as defined by the Property Manager.",
      "5.6. The property rights of the exterior walls of the buildings of SARDAR'S MALL will rest with the management including different types of colors, shades and designs on the exterior of the building. Any change in the color scheme of the exterior walls shall not be permitted under any circumstances. Similarly, no projections/ hooks/ nails etc., will be allowed to be fixed on the exterior walls of the building. Any such interference with the exterior of a unit will be promptly rectified by the Property Manager at the Buyer/Vendee and Owner's cost.",
      "5.7. The Seller/Vendor is the sole entity with the right to approve or implement any structural or design changes at the PROJECT.",
      "5.8. The vacant possession and occupation of the Unit shall be given to and taken by the respective Buyer/Vendee on the handing over date. All risks with respect to the Unit shall be passed to the Buyer on the Completion Date. The Seller/Vendor shall be entitled to decline to handover possession and occupation to the Buyer/Vendee, if the Buyer/Vendee fails to make payments as referred to in Clause 4 or has failed to comply with any other provisions of this Agreement.",
    ],
  },
  {
    number: "6",
    title: "GOVERNING LAWS AND JURISDICTION",
    paragraphs: [
      "6.1. This Agreement shall be governed by and construed in accordance with the laws of Islamic Republic of Pakistan.",
      "6.2. In the event of any dispute or difference arising between the Parties out of or relating to this Agreement or to the breach thereof, the Parties shall use their best endeavors to amicably settle such dispute or difference. To this effect they shall consult and negotiate with each other, in good faith and understanding of their mutual interests to reach a just and equitable solution satisfactory to both Parties. If they do not reach such solution within a period of 30 (thirty) days from the arising out of the dispute, then the dispute or difference shall be finally settled by arbitration in accordance with the Rules of the Master Developer.",
      "6.3. The arbitration shall be carried-out before a tribunal consisting of 3 (three) arbitrators. Within 30 (thirty) days' notice by any one Party to the other of its demand for arbitration, which demand shall also set forth the name of its arbitrator, the other Party shall select its/his arbitrator and so notify the demanding Party. Then within 30 (thirty) days thereafter, the two arbitrators so selected shall select a third arbitrator. In the event of the appointed arbitrators' failure to agree upon and select a third arbitrator (Umpire) within 30 (thirty) days, Master Developer shall appoint the third arbitrator. In the event of a default by either of the Parties in dispute to name its arbitrator, the arbitrator so appointed by the non-defaulting Party shall have the power to proceed to arbitrate and determine the matters of disagreement as if he was an arbitrator appointed by both Parties in dispute for that purpose.",
      "6.4. The place of arbitration shall be the city of Rawalpindi, Pakistan. The arbitration proceedings and award shall be conducted and written in the English language with the applicable law being the Arbitration Act, 1940, or any other law for the time being in force.",
      "6.5. The arbitration award shall be final and binding on both Parties and not subject to any appeal. Any monetary award shall be made payable in PKR free of any tax or any other charge/deduction. The award shall include costs and expenses of the prevailing Party including its/his reasonable legal fees and interest from the date of any breach or other violation of any of the provisions of this Agreement to the date when the award is paid in full. The arbitrators shall fix an appropriate rate of profit/compensation.",
      "6.6. The jurisdiction of the court is hereby expressly excluded save to the extent that a matter may be referred to arbitration as agreed to hereinabove, and the enforcement of an award granted as a result of the aforementioned arbitration proceedings. Provided further that no judicial proceedings claiming injunctive relief may be brought against the Seller/Vendor and should there be any dispute as to the interpretation of terms, or the interpretation of any clause contained herein, the interpretation of the Seller/Vendor shall be final and binding.",
      "6.7. The award of the arbitration shall be the sole and exclusive remedy between the Parties regarding any and all claims and counterclaims, and any relief not claimed by a party to the arbitration shall be deemed to be abandoned.",
    ],
  },
  {
    number: "7",
    title: "NOTICES",
    paragraphs: [
      "Any notice given under this Agreement shall be in writing in English or in Urdu and shall be served by delivering it personally or sending it by courier or electronic means to the physical or electronic address or number as set out in this Agreement. Any such notice shall be deemed to have been received:\n(a) If delivered personally, at the time of delivery;\n(b) In the case of courier, on the date of delivery as evidenced by the records of the courier;\n(c) In the case of electronic transmission, at the recorded time of transmission;\n(d) In case of registered mail at the address listed at the first page of this agreement, the day of posting.",
    ],
  },
  {
    number: "8",
    title: "BUYER'S COVENANTS",
    paragraphs: [
      "8.1. Apart from the purchase price of the Unit, the Buyer/Vendee acknowledges that he/she will also pay documentation charges for leases if any, connection and meter charges of electricity, water, Gas or other utilities for the Units where applicable.",
      "8.2. Transfer of property rights of the Unit shall be subject to the policy of Master Developer at the time of the request and the managing entity or Master Developer shall issue approval or disapproval in writing and shall not unreasonably withhold such response or authorization.",
      "8.3. The Buyer/Vendee shall comply with and abide by the rules, regulations, by laws, orders and / or directions that may be issued by Seller/Vendor as a result of the nature of the unit/property under the Services Agreement, or at the direction of Government Authorities/ Master Developers/ Agencies/ Departments, from time to time.",
      "8.4. The Buyer/Vendee's physical and digital addresses shall be deemed to be those that the Buyer/Vendee has provided in the application form and in this Agreement.",
      "8.5. The Buyer/Vendee shall intimate to the management of SARDAR'S MALL of any change in his/her digital and physical addresses to which the communications meant for the Buyer/Vendee shall be sent.",
      "8.6. Commencing from the date of first notice served upon the Buyer/Vendee and Owner by the Seller/Vendor that the Unit is ready for use and occupation, the Buyer/Vendee and Owner shall be liable to bear and pay all ongoing taxes, CAM (Common area maintenance charges), property management charges or society charges as levied by any concerned authority and/or entity if any and governed by the Property Manager.",
      "8.7. That the Property Manager shall be responsible for the maintenance, management, up keep and custodianship of all common areas within the Project, including, among others, the cleanliness of all hallways, common areas and passages, entrances, front and rear facade, driveways, parking areas, common/shared/public toilets, elevators/escalators, pools and fountains (where applicable) along with back and utility areas etc. including the fittings and fixtures of the same, and the Buyer shall execute and be bound by the terms of the Management Agreement to which the Project and its occupants are all subject, and the Buyer shall not refuse or object to the same.",
      "8.8. The possession of the Commercial Unit will rest with the Seller/Vendor and may be delivered to the Property Manager, either of whom shall be authorized to rent-out the premises. The Buyer/Vendee, upon full payment for the Unit's purchase price with payments made on or before their respective due dates stipulated on the Buyer/Vendee's payment plan mentioned in this agreement, shall be entitled to receive rent as per the determination of the rental value by the Seller and/or Property Manager as the case may be.",
      "8.9. The Buyer of a Commercial Unit acknowledges that the same may, at the discretion of the Property Manager, or the Seller as the case may be; be merged, combined or clubbed with another Unit(s) for the purpose of giving on rent, and the Buyer acknowledges that he/she shall be entitled only to the receipts of rent as per square footage which shall be determined by the prevailing rates set by the Property Manager or Seller and, at no point in time shall the Buyer raise any objection to such merger of his Unit or the receipt of rent as may be determined by the Property Manager or Seller.",
      "8.10. The Buyer of a Residential Unit not falling under the management of the Property Manager, acknowledges that if he/she sells or rents out the said unit to a third party, the Third-Party Contract would be a personal contract between Buyer and the third party and that the Master Developer will assume no liability and gives no warranty to the third party for the proper performance of the Buyer's obligations hereunder.",
      "8.11. The Buyer/Vendee letting-out or renting-out his/her Unit, covenants that they shall do so subject to the third-party tenant/occupier being bound by the terms of usage of the Unit and common areas under this Agreement, the Management Agreement with the Property Manager and the Seller/Vendor's obligations under the Services Agreement, and to ensure this, the Buyer/Vendee will only utilize the standard lease terms approved by the Seller/Vendor and the Property Manager.",
      "8.12. The Buyer/Vendee acknowledges, confirms and understands that this Agreement is an agreement entered into with the Seller/Vendor and that the Master Developer assumes no liability whatsoever and provides no warranties of whatsoever nature to the Buyer/Vendee in respect of proper performance of the Seller/Vendor's obligations hereunder.",
    ],
  },
  {
    number: "9",
    title: "ADJUSTMENTS",
    paragraphs: [
      "9.1. The Buyer/Vendee shall be solely liable for all taxes, rates assessments, utilities and/or other charges that may be levied by any Governmental, quasi-Governmental, Master Developer, Property Manager and local authorities on the PROJECT for the time being in force or that may come into force at later stage.",
    ],
  },
  {
    number: "10",
    title: "COVENANTS GOVERNING USAGE AND TENANCY",
    paragraphs: [
      "10.1. The usage of the premises/units shall be exclusively in accordance with their function and classification i.e. commercial purpose for commercial units, residential purpose for residential units and office purpose for office units.",
      "10.2. Furthermore, the Buyer hereby agrees that the Commercial Unit shall be let-out through the Seller or Property Manager as the case may be, and the Buyer shall only be entitled to claim rent on the area per square footage owned by him/her.",
      "10.3. All units shall be let-out in accordance with the approved tenancy guidelines/approved standard tenancy terms and regulations as may be notified by either the Seller or the Property Manager from time to time, and on the format to be provided by the Property Manager.",
      "10.4. The Seller, or Property Manager as the case may be, shall have the exclusive rights to lease the commercial units, which, the Seller covenants, shall only be leased-out according to the minimum tenancy requirements laid down by the Property Manager and/ or the seller as the case may be.",
      "10.5. The Seller or the Property Manager, as the case may be, reserves the right to take-on the management of leased-out commercial units, whereby they shall be responsible for the leasing-out of the unit in question against which they may charge a fee separate and distinct from any other fee contemplated in either this Agreement, the Management Agreement or any other agreement for the time-being in force.",
      "10.6. Transfer of property rights of the Unit will be subject to the policy of management prevailing at the time of the request and shall only be deemed approved when such request is approved in writing.",
      "10.7. All common areas shall remain the exclusive property and in the exclusive usage of the Seller or the Property Manager as the case may be, and the same shall be entitled to make use of as the Property Manager may deem fit and appropriate and the Buyer will not object to the same.",
    ],
  },
  {
    number: "11",
    title: "TRANSFER OF TITLE",
    paragraphs: [
      "11.1. Provided the Buyer/Vendee has fulfilled his obligations under the terms of this Agreement, the Seller/Vendor shall endeavor to transfer a clear and unencumbered title in respect of the Unit in the PROJECT to the Buyer/Vendee on or after the Handover Date.",
      "11.2. It is the Buyer/Vendee's responsibility to procure the title of the Purchased Unit in the PROJECT from the Master Developers. The Buyer/Vendee shall be responsible for all charges/expenses payable to the Master Developers and on account of Master Community Developers (Rawalpindi Development Authority/Municipal Corporation).",
      "11.3. A transfer fee shall be applicable upon the Buyer/Vendee at the time of transfer of the Unit and will be calculated according to size and specification of Unit by the transferring authority.",
      "11.4. Except with the prior written Approval of the Seller/Vendor, the Buyer/Vendee cannot transfer his/her right of the Unit by sale, abnormal lease and mortgage of such rights to any authorized loan giving agency, bank or any other financial institution which is in capacity to mortgage such rights.",
      "11.5. Except with the prior written Approval of the Seller/Vendor, the Buyer/Vendee cannot transfer his/her right of the apartment by sale, abnormal lease and mortgage of such rights to any other third party.",
      "11.6. Except with the prior written Approval of Seller/Vendor and prior to the payment of at least 50% of the purchase price to the Seller/Vendor, the Buyer/Vendee cannot resell or offer for sale for any monetary or physical benefit of their respective purchased Unit. All re-sold Units are subject to the stipulations of this Agreement and all relevant fees. The Seller/Vendor will have first right of refusal in case a unit is being resold by the Buyer/Vendee.",
      "11.7. If the Buyer/Vendee sells the Unit at any time prior to the procurement of the title deed, the Buyer/Vendee shall pay the Seller/Vendor an administrative fee of three percent (3%) calculated on the higher amount of either the sale price, or the original Purchase Price and shall pay the Master Developer and/or the Government of Pakistan any such fee levied by these institutions to register the sale and transfer of title. The Seller/Vendor may make a provision for a lump-sum fee in lieu of its 3% administrative fee at the Buyer/Vendee's request.",
    ],
  },
  {
    number: "12",
    title: "SELLER'S GENERAL COVENANTS",
    paragraphs: [
      "12.1. The Seller/Vendor undertakes that it shall take all reasonable steps necessary to ensure that the Project is completed on the Anticipated Completion Date or as soon as possible after the anticipated date.",
      "12.2. The Seller/Vendor undertakes to cause the Project to be built substantially in accordance with the drawing, in proper and workman like manner and in accordance with good building practice, with good and suitable materials and in accordance with the requirements of all competent authorities.",
      "12.3. The Seller/Vendor shall give the Buyer/Vendee notice in writing of the Completion Date and the handing over date which shall only be deemed to have been determined when such general notice has been given on the Seller/Vendor's website or in writing directly to the Buyer/Vendee.",
      "12.4. The Seller/Vendor will endeavor to appoint a Property Manager that is capable of efficiently and effectively managing and maintaining the PROJECT after completion and during operation at its independent discretion.",
    ],
  },
  {
    number: "13",
    title: "GENERAL STIPULATIONS",
    paragraphs: [
      "13.1. The terms of this Agreement shall not be varied in any way, shape or form without the express approval of the Seller/Vendor, and no such variation in the terms contained herein shall be valid unless the same is executed in like form i.e. in writing and signed by the Parties hereto or their authorized representatives.",
      "13.2. The Buyer/Vendee may not assign or transfer any of the rights accruing under this Agreement to any third-party without the express written consent of the Seller/Vendor.",
      "13.3. No concession or other indulgence granted by the Seller/Vendor to the Buyer/Vendee whether in respect of time for payment or otherwise in regard to the terms and conditions of this Agreement shall be deemed to be a waiver of its rights in terms of this Agreement.",
      "13.4. Where the Buyer/Vendee is more than one person, those persons are jointly and severally liable in respect of the obligations undertaken by them under this Agreement.",
      "13.5. Each of the parties shall immediately upon being requested to do so, sign/execute all such documents in connection with the transfer of title and generally as are necessary to give effect to this Agreement.",
      "13.6. This Agreement together with Schedules constitute the entirety of the terms agreed between the parties relating to the subject matter of this Agreement and supersedes all previous verbal or written agreements and negotiations between the parties including but not limited to representations made in the marketing material, sales brochures, models, photographs, videos, illustrations, and other such marketing material.",
      "13.7. The Buyer/Vendee acknowledges that in agreeing to enter into this Agreement, the Buyer/Vendee has not relied on any representations, warranties or other assurances made by or on behalf of the Seller/Vendor before the signature of this Agreement except those set out in this Agreement.",
      "13.8. The Buyer/Vendee may, subject to the prior written approval of the Seller/Vendor, and subject to any policy considerations, by-laws or rules of the Master Developer, avail a mortgage or Islamic Shirkat-O-Muzarbat to enable the Buyer/Vendee and successors-in-title to purchase the Unit.",
    ],
  },
  {
    number: "14",
    title: "COPIES OF THE AGREEMENT",
    paragraphs: [
      "The Parties have executed this Agreement in two (2) originals signed by both Parties and equally distributed between them. The Schedules attached hereto and stamped and signed shall be deemed an integral part of this Agreement.",
    ],
  },
  {
    number: "15",
    title: "DEFAULT AND TERMINATION/CANCELLATION",
    paragraphs: [
      "15.1. If the Buyer/Vendee:\nA) Cancels or withdraws from this Agreement; or\nB) Is insolvent or is under the process of liquidation; or\nC) Defaults or fails to abide by the payment schedule agreed to and contained herein above, or fails to fulfill on the due date, any of the terms and conditions of this Agreement, then:\nThe Seller/Vendor shall give the Buyer/Vendee at most one instance of a thirty (30) days' notice in writing calling on the Buyer/Vendee to remedy such default and if the Buyer/Vendee fails to comply with such notice then the Seller/Vendor shall be entitled, without further notice and without prejudice to any other remedies accruing under this Agreement or rights arising from any law for the time being in force, to:\nI. Terminate this Agreement and cancel the allotment of the Buyer; and\nII. Reserve the rights to re-allot/re-sell any unit deemed surrendered by defaulting Buyer or whose allotment has been canceled due to nonpayment of dues to any other applicant or person as per the stipulations of this agreement and defaulting Buyer shall have no right on the unit whatsoever. Insofar, the decision of the management in this regard shall be final.\nIII. To claim, at the option of the Seller, compensation in an amount of not less than Thirty-five (35) percent of the total Purchase Price as pre-estimated liquidated damages, which the Buyer expressly agrees is a true and reasonable pre-estimate of the losses and damages that will be suffered by the Seller as a result of the Buyer's default; and/or",
      "15.2. In case of termination of this Agreement, the Buyer/Vendee shall surrender all original documents, acknowledgements of receipt and any other correspondence under the Agreement, including without limitation the Agreement itself.",
      "15.3. Notwithstanding the provisions of Clause 15.1 (III) above, to retain and take into account all payments previously made by the Buyer subject to at least Thirty-five percent (35%) on account of the Purchase Price up to the date of termination to the extent necessary to meet the Seller's claim for damages and compensation referred to in Clause 15.1 (III) above, it being understood by the Buyer that if the amounts so paid on account are insufficient to meet the Seller's claim for compensation, the Buyer shall remain liable to pay the short fall on demand. The Buyer further agrees and undertakes to make such payment to the Seller within thirty (30) days of the Seller's notice of termination.",
      "15.4. In the event of cancellation of the Allotment of the Buyer by the Seller, all payments made up till the date of cancellation shall be refunded by the Seller in Pakistani Rupees (PKR) after a period of one year from the date of cancellation. The refund shall, however, be subject to a deduction of Thirty-five percent (35%) of the amount so received till the date of cancellation. The return of the said amount by the Seller to the buyer, shall be without any profit, interest, or mark-up. Moreover, any amount or sums paid towards processing fees shall be non-refundable.",
    ],
  },
  {
    number: "16",
    title: "EFFECTIVE DATE",
    paragraphs: [
      "This Agreement shall be effective and binding upon the parties from the date first above appearing. Unless terminated earlier pursuant to the provisions of Clause 15, this Agreement shall survive the Completion Date insofar as any rights and obligations contained herein are of continuing effect.",
    ],
  },
  {
    number: "17",
    title: "MANAGING AGENT",
    paragraphs: [
      "17.1. The Seller/Vendor shall have the power from time to time to appoint in terms of a written contract, a Property Manager to control, manage, maintain and administer the PROJECT and Common Use Facilities or any aspect thereof and exercise such powers and duties as may have been entrusted to the Managing Agent, including power to collect Service Charges, Property Management Charges, Franchise Charges, and other facility charges including those independent from the Master Developer. Any default or delay in payment of such Service Charges shall fall within the framework of the default clauses pursuant to clause 15.1 and may result in the termination of common use facilities, access, or any other building and project provisions.",
      "17.2. Apart from Master Developer fees and taxes levied on individual ownership and income from respective Units, The Property Manager may club CAM, property management charges, facilities maintenance and expenses, facility related taxes, facilities fees and expenses, and other operational Project expenses under an individual or set of individual property management and facilities charge so as to more efficiently and appropriately manage the Project for the collective benefit for all Owners and Tenants of the Project.",
    ],
  },
  {
    number: "18",
    title: "UTILITIES",
    paragraphs: [
      "18.1. Every Unit, whether residential, commercial or Office; and by extension its Owner or occupier, shall be responsible for the payment of all fees and charges pertaining to maintenance and utilities utilized within the Unit, including (but not limited to) water, electricity, gas, chilled water, telecommunications and any other Utilities required in connection with his/her Unit, and neither the Seller nor the Property Manager shall be responsible for any default on the part of any Owner or occupier in payment for the same.",
      "18.2. Each Owner of a Unit delegates onto the Property Manager, the decision to acquire facilities from the Master Developer or other providers to ensure continual satisfaction of standards of SARDAR'S MALL including, but not limited to, Security, Maintenance, Beautification etc. with the Owner bearing their share of the expenses whose divisibility is and will be decided solely by the Property Manager.",
      "18.3. No advertisements or publicity material shall be displayed on the Common Use Facilities, Plot or Unit without the prior explicit written permission of the Seller/Vendor and that too only upon the terms and conditions contained in such consent.",
      "18.4. Neither the Master Community nor the Seller shall be liable for any injury or loss or damage of any description which any Owner or Occupier may sustain, physically or to his or their property, directly or indirectly, in respect of Common Use Facilities or in the Plot or Units by reason of any defect in the Common Use Facilities, its amenities or in the Units or for any act done or for any neglect on the part of the Master Community or the Seller, any of their employees, servants, agents or contractors which could not reasonably be foreseen or anticipated by the Seller. The above rules are equally binding upon any or all Occupiers and Owners shall procure that their Occupiers are aware of and comply with them.",
    ],
  },
  {
    number: "19",
    title: "FORCE MAJEURE",
    paragraphs: [
      'Neither party shall be considered to be in default or breach of an obligation under this Agreement if performance of the obligation is prevented or delayed by any Force Majeure Event, or any cause beyond the reasonable control of the Parties to this agreement provided that the affected Party gives to the other Party a written notice within thirty (30) days of such an event indicating such circumstances. However, an event of Force Majeure shall not excuse a failure by a party to make a payment as and when it falls due. A "Force Majeure" is any event or circumstance (or a combination of events and circumstances) which is beyond the reasonable control of the affected party including (but not) limited to strikes, lockouts, fires, contamination, natural disasters, acts of God, war, terrorism, and other hostilities, invasion, sabotage, public disorders, and any action by or inaction of a Government or Governmental or juridical authority or similar body, the Master Developer or due to restrictions imposed by the Master Developer or Government. The time for performance of any obligation of either party delayed by Force Majeure shall be extended accordingly.',
    ],
  },
  {
    number: "20",
    title: "CONFIDENTIALITY",
    paragraphs: [
      "The Parties agree that either Party will not directly or indirectly in any capacity make use or disclose or permit to be disclosed to any other person (except as may be necessary to comply with any statutory obligation or order of any court or statutory tribunal) any confidential information relating to or belonging to the other Party which comes into its possession directly or indirectly as a consequence of this Agreement. For the sake of clarity, confidential information shall include but not be restricted to inter-alia matters of technical or financial nature, financial position and sources of both Parties including, but not limited to, the sale consideration agreed between the parties and any concessions granted by the Seller in favor of the Buyer/Vendee, or any information relating to the Services Agreement.",
    ],
  },
  {
    number: "21",
    title: "REPRESENTATION",
    paragraphs: [
      '21.1. The Buyer/Vendee understands that the figures, descriptions, pictures, layouts, and other details pertaining to the Project and references to conditions necessary for transfer, use and occupation of the Unit are indicative and are given in good faith by the Seller/Vendor and the Master Developer and are believed to be correct as on the date of this Agreement. Such information may change from time to time in accordance with the final design of the PROJECT and planning permissions and such information may be subject to change by the Seller/Vendor and the Master Developer without notice to the Buyer/Vendee. The Buyer/Vendee acknowledges and agrees that the Seller/Vendor and/or the Master Developer may from time to time in its sole discretion or as required by any competent authority change, vary, modify the plans, contours, materials, finishes, equipment, fixtures, and specifications pertaining to the PROJECT and master plan of the community, and the Property mentioned herein without notice to the Buyer/Vendee. The Seller/Vendor makes no guarantee, representation or warranty in respect of the information provided by the Master Developer and the Seller/Vendor accepts no liability as to its accuracy or completeness. The Seller/Vendor or any of his respective officers, employees, representatives, servants or agents (the "Relevant Parties") have no obligation or liability whatsoever and howsoever arising to the Buyer/Vendee or any third party arising from, out of, or in connection with this Agreement, the transaction contemplated herein or attributable to any acts, errors, or omissions of the Relevant Parties or any applicable Governmental or municipal authority. None of the Relevant Parties has, or will be deemed to have, made or given any terms, conditions, covenants, warranties, or representations, express or implied (whether statutory or otherwise), with respect to this Agreement or the transaction contemplated herein.',
      "21.2. The Buyer/Vendee considering the investment in the PROJECT has studied the documents, plans, the Master Developer's documentation and requirements for transfer and registration, Unit's plans and on-going payment schedule.",
      "21.3. The Buyer/Vendee acknowledges, understands and accepts that this Agreement and the terms contained herein represent the complete understanding, offer and acceptance of the terms agreed between the Parties, and any term, condition, representation, warranty made by any party or agent on behalf of the Seller/Vendor which is not contained herein shall in no way be binding upon, or enforceable against, the Seller/Vendor, and of no legal effect.",
    ],
  },
  {
    number: "22",
    title: "SEVERABILITY",
    paragraphs: [
      "22.1. If any provision of this Agreement becomes invalid, illegal or unenforceable, the Parties hereto shall, in such event, mutually agree, in good faith on another substitute provision to replace the invalid, illegal or unenforceable provision which shall, as nearly as possible, validly give effect to the intentions of the Parties hereto, as expressed herein.",
      "22.2. Provided that should any clause contained herein become invalid, illegal or unenforceable due to the operation of any law for the time being in force, it shall have no bearing upon the validity of any of the clauses contained within this Agreement as a whole or the Summarized Agreement as not so affected.",
    ],
  },
];
