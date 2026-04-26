-- Up migration
-- Created at: 2025-04-23 15:04:08
-- Created on: 1.1.1
-- Created by: Yara

CREATE TABLE IF NOT EXISTS public_health.citizen_health_profile (
  original_id String COMMENT 'Identificador original de cadastro do cidadão',
  data_source_id Int64 COMMENT 'Identificador da fonte de dados',
  citizen_original_id String COMMENT 'Identificador da tabela de cidadãos',
  name String COMMENT 'Nome completo do cidadão',
  cpf Nullable(String) COMMENT 'CPF do cidadão', 
  cns Nullable(String) COMMENT 'CNS do cidadão', 
  nis Nullable(String) COMMENT 'NIS (Número de Identificação Social) do cidadão',
  last_registration_update DateTime('America/Sao_Paulo') COMMENT 'Data e hora da atualização do cadastro',
  social_name Nullable(String) COMMENT 'Nome social do cidadão',
  is_responsible_family_member Nullable(Bool) COMMENT 'É o membro responsável pela família',
  cpf_responsible_member Nullable(String) COMMENT 'CPF do responsável familiar',
  cns_responsible_member Nullable(String) COMMENT 'CNS do responsável familiar',
  mothers_name Nullable(String) COMMENT 'Nome da mãe do cidadão',
  fathers_name Nullable(String) COMMENT 'Nome do pai do cidadão',
  unknown_mother Nullable(Bool) COMMENT 'Se desconhece a mãe',
  unknown_father Nullable(Bool) COMMENT 'Se desconhece o pai',
  birth_date Date COMMENT 'Data de nascimento', 
  sex Nullable(Enum('male' = 1, 'female' = 2, )) COMMENT 'Sexo do cidadão',
  mobile_phone Nullable(String) COMMENT 'Telefone celular', 
  contact_phone Nullable(String) COMMENT 'Telefone para contato', 
  email Nullable(String) COMMENT 'E-mail', 
  micro_area Nullable(String) COMMENT 'Microárea', 
  skin_color_or_race Nullable(Enum8(
      'white' = 1,
      'black' = 2, 
      'mixedRace' = 3, 
      'indigenous' = 4,
      'yellow' = 5,
      'noInformation' = 6
  )
  ) COMMENT 'Cor de pele/Raça',
  ethnicity Nullable(String) COMMENT 'Etnia',
  nationality Nullable(Enum8(
      'brazilian' = 1, 
      'naturalized' = 2, 
      'foreigner' = 3
  )
   ) COMMENT 'Nacionalidade', 
  country_of_birth Nullable(String) COMMENT 'País de nascimento', 
  naturalization_date Nullable(Date) COMMENT 'Data de Naturalização',
  naturalization_ordinance Nullable(String) COMMENT 'Portaria de Naturalização', 
  date_of_entry_in_brazil Nullable(Date) COMMENT 'Data de entrada no Brasil',
  birthplace_municipality Nullable(String) COMMENT 'Município de nascimento', 
  birthplace_state Nullable(String) COMMENT 'UF/Estado de nascimento', 
  kinship_with_family_responsible Nullable(
  Enum8( 
    'sonOrDaughter' = 1, 
    'stepsonOrStepdaughter' = 2, 
    'grandSonOrGrandDaughterOrGreatGrandsonOrGreatGranddaughter' = 3, 
    'fatherOrMother' = 4,
    'fatherInLawOrMotherInLaw' = 5,
    'brotherOrSister' = 6,
    'sonInLawOrDaughterInLaw' = 7,
    'otherRelative' = 8,
    'nonRelative' = 9,
    'spouse' = 10
  )
) COMMENT 'Relação de parentesco com o responsável familiar',
  occupation Nullable(String) COMMENT 'Ocupação',
  attends_school_or_daycare Nullable(Bool) COMMENT 'Se frequenta escola ou creche',
  education_level Nullable(
    Enum8(
      'nursery' = 1, 
      'preschool' = 2, 
      'literacyClass' = 3, 
      'elementarySchool1StTo4ThGrades' = 4,
      'elementarySchool5ThTo8ThGrades' = 5,
      'elementarySchool' = 6,
      'specialElementarySchool' = 7,
      'incompleteHigherEducation' = 8,
      'elementaryEducationForYouthAndAdultsInitialGrades' = 9,
      'elementaryEducationForYouthAndAdultsFinalGrades' = 10,
      'highSchool' = 11,
      'specialHighSchool' = 12,
      'highSchoolForYouthAndAdults' = 13,
      'higherEducation' = 14,
      'adultLiteracy' = 15,
      'none' = 16
    )
  ) COMMENT 'Grau de instrução/escolaridade',
  employment_status Nullable(
    Enum8(
      'employer' = 1, 
      'employeeWithFormalEmploymentContract' = 2, 
      'employeeWithoutFormalEmploymentContract' = 3, 
      'selfEmployedWithSocialSecurityCoverage' = 4,
      'selfEmployedWithoutSocialSecurityCoverage' = 5,
      'retiredOrPensioner' = 7,
      'unemployed' = 8,
      'notWorking' = 9,
      'publicServantOrMilitaryPersonnel' = 10,
      'other' = 11
    )
  ) COMMENT 'Situação no mercado de trabalho',
  child_zero_to_nine_years_old Nullable(Bool) COMMENT 'Se é criança de 0 a 9 anos',
  child_zero_to_nine_years_old_who_takes_care Nullable(String) COMMENT 'Se é criança de 0 a 9 anos com quem fica',
  attends_alternative_healer Nullable(Bool) COMMENT 'Se frequenta algum cuidador tradicional ou popular',
  take_part_in_community_groups Nullable(Bool) COMMENT 'Se participa de algum grupo comunitário',
  has_private_health_insurance Nullable(Bool) COMMENT 'Se possui plano de saúde privado',
  member_of_traditional_groups_or_community Nullable(Bool) COMMENT 'É membro de povo ou comunidade tradicional?',
  wich_traditional_groups_or_community Nullable(String) COMMENT 'Caso pertença, qual povo ou comunidade tradicional',
  wish_to_inform_sexual_orientation Nullable(Bool) COMMENT 'Se deseja informar a orientação sexual',
  sexual_orientation Nullable(
    Enum8(
      'heterosexual' = 1, 
      'bisexual' = 2, 
      'homosexual' = 3, 
      'other' = 4
    )
  ) COMMENT 'Qual a orientação sexual',
  wish_to_inform_gender_identity Nullable(Bool) COMMENT 'Se deseja informar a identidade de gênero',
  gender_identity Nullable(String) COMMENT 'Qual a identidade de gênero',
  has_any_disability Nullable(Bool) COMMENT 'Se possui alguma deficiência',
  which_disability Nullable(String) COMMENT 'Qual(is) deficiências possui',
  during_the_last_three_months_had_food_shortage_without_financial_means_to_get_more Nullable(Bool) COMMENT 'Se durante os últimos três meses, os alimentos acabaram antes de possuir renda para obter mais',
  during_the_last_three_months_ate_only_available_food_because_of_lack_of_money Nullable(Bool) COMMENT 'Se em algum momento durante os últimos três meses, comeu somente os alimentos que possuía por falta de dinheiro',
  moved Nullable(Bool) COMMENT 'Mudou-se',
  deceased Nullable(Bool) COMMENT 'Se o cidadão faleceu',
  death_date Nullable(Date) COMMENT 'Data do óbito',
  death_certificate_number Nullable(String) COMMENT 'Número da declaração de óbito',
  is_pregnant Nullable(Bool) COMMENT 'Se está gestante',
  reference_maternity_hospital Nullable(String) COMMENT 'Qual a maternidade de referência para a gestante',
  current_weight_status Nullable(
    Enum8(
      'underweight' = 1, 
      'normalWeight' = 2, 
      'overweight' = 3
    )
  ) COMMENT 'Como identifica a situação do peso atual',
  smoker Nullable(Bool) COMMENT 'Se é fumante',
  consumes_alcoholic_beverages Nullable(Bool) COMMENT 'Se faz uso de bebidas alcoólicas',
  take_drugs Nullable(Bool) COMMENT 'Se faz uso de drogas',
  has_hypertension Nullable(Bool) COMMENT 'Se tem hipertensão arterial',
  has_diabetes Nullable(Bool) COMMENT 'Se tem diabetes',
  had_stroke Nullable(Bool) COMMENT 'Se teve AVC',
  had_heart_attack Nullable(Bool) COMMENT 'Se já infartou',
  has_heart_disease Nullable(Bool) COMMENT 'Se possui alguma doença cardíaca',
  which_heart_disease Nullable(String) COMMENT 'Qual(is) doença(s) cardíaca(s) possui',
  had_kidney_disease Nullable(Bool) COMMENT 'Se tem ou teve alguma doença renal',
  which_kidney_disease Nullable(String) COMMENT 'Qual(is) doença(s) renal(is) possui',
  has_respiratory_disease Nullable(Bool) COMMENT 'Possui alguma doença respiratória',
  which_respiratory_disease Nullable(String) COMMENT 'Qual(is) doença(s) respiratória(s) possui',
  has_leprosy Nullable(Bool) COMMENT 'Se está com hanseníase',
  has_tuberculosis Nullable(Bool) COMMENT 'Se está com tuberculose',
  had_cancer Nullable(Bool) COMMENT 'Se teve ou está com câncer',
  during_the_last_6_months_had_any_hospital_internment Nullable(Bool) COMMENT 'Se teve alguma internação nos últimos meses',
  hospital_internment_reasons Nullable(String) COMMENT 'Qual o motivo da internação',
  has_medical_professional_diagnosis_of_mental_conditions Nullable(Bool) COMMENT 'Teve diagnóstico de algum problema de saúde mental por profissional de saúde',
  is_bedridden Nullable(Bool) COMMENT 'Se está acamado',
  is_domiciled Nullable(Bool) COMMENT 'Se está domiciliado',
  uses_medicinal_plants Nullable(Bool) COMMENT 'Se usa plantas medicinais',
  which_medicinal_plants Nullable(String) COMMENT 'Quais plantas medicinais',
  makes_use_of_other_integrative_and_complementary_practices Nullable(Bool) COMMENT 'Usa outras práticas integrativas e complementares',
  have_other_health_conditions Nullable(String) COMMENT 'Quais outras condições de saúde possui',
  homeless Nullable(Bool) COMMENT 'Está em situação de rua',
  homeless_for_how_many_time Nullable(
    Enum8(
      'lessThanSixMonths' = 1, 
      'sixToTwelveMonths' = 2, 
      'oneToFiveYears' = 3,
      'moreThanFiveYears' = 4
    )
  ) COMMENT 'Há quanto tempo está em situação de rua',
  receives_benefit Nullable(Bool) COMMENT 'Recebe algum benefício',
  have_any_kind_of_family_reference Nullable(Bool) COMMENT 'Possui referência familiar',
  eat_how_many_times_day Nullable(
    Enum8(
      'once' = 1, 
      'twoOrThreeTimes' = 2, 
      'moreThanThreeTimes' = 3
    )
  ) COMMENT 'Quantas vezes se alimenta por dia',
  food_source Nullable(String) COMMENT 'Qual a origem da alimentação',
  assisted_by_any_institution Nullable(Bool) COMMENT 'Tem acompanhamento de alguma instituição',
  assisted_by_which_institution Nullable(String) COMMENT 'De qual instituição tem acompanhamento',
  visit_family_members_often Nullable(Bool) COMMENT 'Se visita algum familiar com frequência',
  kinship_with_visited_family_member Nullable(String) COMMENT 'Qual o grau de parentesco com o familiar visitado',
  has_access_to_personal_hygiene Nullable(Bool) COMMENT 'Tem acesso a higiene pessoal',
  which_access_to_personal_hygiene Nullable(String) COMMENT 'Quais acessos a higiene pessoal possui',
  refused_to_register Nullable(Bool) COMMENT 'Se recusou o cadastro',
  professional_cns Nullable(String) COMMENT 'CNS do profissional',
  professional_cbo Nullable(String) COMMENT 'Código CBO do profissional',
  professional_cnes Nullable(String) COMMENT 'CNES do profissional',
  professional_ine Nullable(String) COMMENT 'INE do profissional',
  created_at DateTime('America/Sao_Paulo') COMMENT 'Data e hora da criação do registro',
  updated_at DateTime('America/Sao_Paulo') COMMENT 'Data e hora da última atualização do cadastro, usado como versão',
  is_deleted Bool COMMENT 'Indica se o registro foi deletado'
) ENGINE = ReplacingMergeTree(updated_at, is_deleted) PARTITION BY data_source_id
ORDER BY (data_source_id, original_id);

--

CREATE TABLE IF NOT EXISTS public_health.residence (
    original_id String COMMENT 'Identificador original da residência',
    data_source_id Int64 COMMENT 'Identificador da fonte de dados',
    resident_count Nullable(UInt16) COMMENT 'Quantidade de moradores', -- qt_morador
    room_count Nullable(UInt16) COMMENT 'Número de cômodos', -- nu_comodo
    has_registration_refusal Nullable(Bool) COMMENT 'Recusa de cadastro', -- st_recusa_cadastro
    property_type Nullable(Enum16(
      'residence' = 1, 
      'commerce' = 2, 
      'vacantLand' = 3, 
      'school' = 5, 
      'dayCare' = 6, 
      'shelter' = 7, 
      'longTermFacilityForElderly' = 8, 
      'prisonUnit' = 9, 
      'socioEducativeMeasureUnit' = 10, 
      'policeStation' = 11, 
      'religiousEstablishment' = 12, 
      'others' = 13, 
      'strategicPoint' = 4  
    )) COMMENT 'Tipo de imóvel', -- co_dim_tipo_imovel
    date Date COMMENT 'Data da atualização da ficha', -- co_dim_tempo
    housing_situation Nullable(Enum8(
      'notInformed' = 10,
      'owned' = 1,
      'financed' = 2,
      'rented' = 3,
      'leased' = 4,
      'granted' = 5,
      'occupation' = 6,
      'streetSituation' = 7,
      'invasion' = 8,
      'other' = 9
    )) COMMENT 'Situação da moradia', -- co_dim_tipo_situacao_moradia
    location_type Nullable(Enum8(
        'notInformed' = 1,
        'urban' = 2,
        'rural' = 3
    )) COMMENT 'Localização do domicílio', -- co_dim_tipo_localizacao
    house_type Nullable(Enum8(
        'notInformed' = 5,
        'house' = 1,
        'apartment' = 2,
        'room' = 3,
        'other' = 4
    )) COMMENT 'Tipo de domicílio', -- co_dim_tipo_domicilio
    land_possession_type Nullable(Enum16(
        'notInformed' = 9,
        'owner' = 1,
        'partnerOrSharecropper' = 2,
        'settled' = 3,
        'squatter' = 4,
        'leaseholder' = 5,
        'loanRecipient' = 6,
        'landBankBeneficiary' = 7,
        'notApplicable' = 8
    )) COMMENT 'Posse da terra', -- co_dim_tipo_posse_terra
    house_access_type Nullable(Enum16(
        'notInformed' = 5,
        'paved' = 1,
        'dirtRoad' = 2,
        'fluvial' = 3,
        'other' = 4
    )) COMMENT 'Acesso ao domicílio', -- co_dim_tipo_acesso_domicilio
    wall_material_type Nullable(Enum16(
        'notInformed' = 9,
        'masonryWithCoating' = 1,
        'masonryWithoutCoating' = 2,
        'mudWallWithCoating' = 3,
        'mudWallWithoutCoating' = 4,
        'planedWood' = 5,
        'recycledMaterial' = 6,
        'straw' = 7,
        'otherMaterial' = 8
    )) COMMENT 'Material da parede', -- co_dim_tipo_material_parede
    water_supply_type Nullable(Enum8(
        'pipedWater' = 1,
        'wellOrSpring' = 2,
        'cistern' = 3,
        'waterTruck' = 4,
        'other' = 5,
        'notInformed' = 6,
        'pipedWaterSesai' = 7,
        'directRiverIntake' = 8,
        'directCollectiveWellIntake' = 9,
        'publicFountain' = 10
    )) COMMENT 'Abastecimento de água', -- co_dim_tipo_abastecimento_agua
    water_treatment_type Nullable(Enum8(
        'notInformed' = 1,
        'filtered' = 2,
        'boiled' = 3,
        'chlorinated' = 4,
        'mineral' = 5,
        'noTreatment' = 6,
        'other' = 7,
        'filteredClay' = 8,
        'filteredOther' = 9,
        'inHouseChlorination' = 10
    )) COMMENT 'Tratamento de água', -- co_dim_tipo_tratamento_agua
    sanitation_type Nullable(Enum8(
        'notInformed' = 1,
        'sewerOrStormwaterCollectionNetwork' = 2,
        'septicTank' = 3,
        'rudimentaryPit' = 4,
        'directToRiverLakeOrSea' = 5,
        'openAir' = 6,
        'other' = 7
    )) COMMENT 'Escoamento sanitário', -- co_dim_tipo_escoamento_sanitar
    garbage_disposal_type Nullable(Enum8(
        'notInformed' = 1,
        'collected' = 2,
        'burnedOrBuried' = 3,
        'openAir' = 4,
        'other' = 5
    )) COMMENT 'Destino do lixo', -- co_dim_tipo_destino_lixo
    cbo Nullable(String) COMMENT 'Código de ocupação', -- co_dim_cbo
    has_electricity Nullable(Bool) COMMENT 'Disponibilidade de energia', -- st_disp_energia
    has_animal Nullable(Bool) COMMENT 'Animal no domicílio', -- st_animal_domiciliar
    animal_count Nullable(UInt8) COMMENT 'Quantidade de animais no domicílio', -- qt_animal_domiciliar
    has_cat Nullable(Bool) COMMENT 'Presença de gato', -- st_animal_gato
    has_dog Nullable(Bool) COMMENT 'Presença de cachorro', -- st_animal_cachorro
    has_bird Nullable(Bool) COMMENT 'Presença de pássaro', -- st_animal_passaro
    has_other_animals Nullable(Bool) COMMENT 'Outros animais', -- st_animal_outros
    has_other_professionals_attached Nullable(Bool) COMMENT 'Outros profissionais vinculados', -- st_outros_prof_vinclds
    micro_area Nullable(String) COMMENT 'Microárea', -- nu_micro_area
    street_name Nullable(String) COMMENT 'Nome do logradouro',
    street_number Nullable(String) COMMENT 'Número do logradouro',
    complement Nullable(String) COMMENT 'Complemento',
    neighborhood Nullable(String) COMMENT 'Bairro',
    reference_point Nullable(String) COMMENT 'Ponto de referência',
    postal_code Nullable(String) COMMENT 'CEP',
    municipality Nullable(String) COMMENT 'Cidade',
    state Nullable(String) COMMENT 'Estado',
    home_phone Nullable(String) COMMENT 'Telefone residencial', -- nu_telefone_residencia
    contact_phone Nullable(String) COMMENT 'Telefone de contato', -- nu_telefone_contato
    professional_cns Nullable(String) COMMENT 'CNS do profissional',
    professional_cbo Nullable(String) COMMENT 'CBO do profissional', 
    professional_cnes Nullable(String) COMMENT 'CBO do profissional', 
    professional_ine Nullable(String) COMMENT 'INE do profissional',
    created_at DateTime('America/Sao_Paulo') COMMENT 'Data e hora da criação do registro',
    updated_at DateTime('America/Sao_Paulo') COMMENT 'Data e hora da última atualização do registro, usado como versão',
    is_deleted Bool COMMENT 'Indica se o registro foi deletado'
    
) ENGINE = ReplacingMergeTree(updated_at, is_deleted) PARTITION BY data_source_id
ORDER BY (data_source_id, original_id);

--

CREATE TABLE IF NOT EXISTS public_health.family (
  original_id String COMMENT 'Identificador original do registro',
  data_source_id Int64 COMMENT 'Identificador da fonte de dados',
  residence_original_id Nullable(String) COMMENT 'Identificador de residência/domicílio',
  responsible_family_member_cpf Nullable(String) COMMENT 'CPF do responsável familiar',
  responsible_family_member_cns Nullable(String) COMMENT 'CNS do responsável familiar',
  moved Nullable(Bool) COMMENT 'Houve mudança de endereço',
  created_at DateTime('America/Sao_Paulo') COMMENT 'Data e hora da criação do registro',
  updated_at DateTime('America/Sao_Paulo') COMMENT 'Data e hora da última atualização do registro, usado como versão',
  is_deleted Bool COMMENT 'Indica se o registro foi deletado'
) ENGINE = ReplacingMergeTree(updated_at, is_deleted) PARTITION BY data_source_id
ORDER BY (data_source_id, original_id);

--

--
CREATE TABLE IF NOT EXISTS public_health.residence_geo (
  original_id String COMMENT 'Identificador original do cidadão',
  data_source_id Int64 COMMENT 'Identificador da fonte de dados',
  longitude Nullable(Float64),
  latitude Nullable(Float64),
  longitude_on_street Nullable(Float64),
  latitude_on_street Nullable(Float64),
  distance_of_street Nullable(Float32),
  angle_from_street Nullable(Float32),
  accuracy Nullable(Float32),
  source Nullable(Enum('geocoding' = 1, 'manual' = 2)),
  geocoding_quality Nullable(String),
  geocoding_quality_score Nullable(Float32),
  building_id Nullable(Int64),
  street_id Nullable(Int64),
  neighborhood_id Nullable(Int64),
  district_id Nullable(Int64),
  municipality_id Nullable(Int64),
  micro_region_id Nullable(Int64),
  meso_region_id Nullable(Int64),
  state_id Nullable(Int64),
  macro_region_id Nullable(Int64),
  country_id Nullable(Int64),
  created_at DateTime('America/Sao_Paulo') COMMENT 'Data e hora da criação do registro',
  updated_at DateTime('America/Sao_Paulo') COMMENT 'Data e hora da última atualização do registro, usado como versão',
  is_deleted Bool COMMENT 'Indica se o registro foi deletado'
) ENGINE = ReplacingMergeTree(updated_at, is_deleted) PARTITION BY data_source_id
ORDER BY (data_source_id, original_id);