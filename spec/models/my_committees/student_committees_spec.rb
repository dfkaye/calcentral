require 'spec_helper'

describe MyCommittees::StudentCommittees do
  let(:feed) { described_class.new(uid).get_feed }
  let(:uid) { random_id }
  let(:fake_student_committees_proxy) { CampusSolutions::StudentCommittees.new(fake: true) }

  context 'fake data' do
    before do
      allow(CampusSolutions::StudentCommittees).to receive(:new).and_return fake_student_committees_proxy
    end
    it 'contains the expected student data for non qualifying exam' do
      committees = feed[:studentCommittees]
      expect(committees[0][:committeeType]).to eq 'STUDENTMILESTONEDESCR1'
      expect(committees[0][:program]).to eq 'STUDENTACADPLAN1'
      expect(committees[0][:statusTitle]).to eq 'Advancement To Candidacy:'
      expect(committees[0][:statusIcon]).to eq 'check'
      expect(committees[0][:statusMessage]).to eq 'Approved'
    end

    it 'contains the expected student data for qualifying exam pending' do
      committees = feed[:studentCommittees]
      expect(committees[1][:committeeType]).to eq 'STUDENTMILESTONEDESCR3'
      expect(committees[1][:program]).to eq 'STUDENTACADPLAN3'
      expect(committees[1][:statusTitle]).to eq 'Exam Date:'
      expect(committees[1][:statusIcon]).to eq 'exclamation-triangle'
      expect(committees[1][:statusMessage]).to eq 'Pending'
    end

    it 'contains the expected student data for qualifying exam dated' do
      committees = feed[:studentCommittees]
      expect(committees[2][:committeeType]).to eq 'STUDENTMILESTONEDESCR4'
      expect(committees[2][:program]).to eq 'STUDENTACADPLAN4'
      expect(committees[2][:statusTitle]).to eq 'Exam Date:'
      expect(committees[2][:statusIcon]).to eq 'check'
      expect(committees[2][:statusMessage]).to eq 'Jan 01, 2024'
    end

    it 'contains the expected student committee data for chairs' do
      members = feed[:studentCommittees][0][:committeeMembers]
      expect(members[:chair][0][:name]).to eq 'MEMBERFIRSTNAME1 MEMBERLASTNAME1'
      expect(members[:chair][0][:email]).to eq 'MEMBER@EMAIL.1'
      expect(members[:chair][0][:primaryDepartment]).to eq 'MEMBERDEPTDESCR1'

      expect(members[:chair][1][:name]).to eq 'MEMBERFIRSTNAME2 MEMBERLASTNAME2'
      expect(members[:chair][1][:email]).to eq 'MEMBER@EMAIL.2'
      expect(members[:chair][1][:primaryDepartment]).to eq 'MEMBERDEPTDESCR2'
    end

    it 'contains the expected student committee data for co-chairs' do
      members = feed[:studentCommittees][0][:committeeMembers]
      expect(members[:coChair][0][:name]).to eq 'MEMBERFIRSTNAME3 MEMBERLASTNAME3'
      expect(members[:coChair][0][:email]).to eq 'MEMBER@EMAIL.3'
      expect(members[:coChair][0][:primaryDepartment]).to eq 'MEMBERDEPTDESCR3'

      expect(members[:coChair][1][:name]).to eq 'MEMBERFIRSTNAME4 MEMBERLASTNAME4'
      expect(members[:coChair][1][:email]).to eq 'MEMBER@EMAIL.4'
      expect(members[:coChair][1][:primaryDepartment]).to eq 'MEMBERDEPTDESCR4'
    end

    it 'contains the expected student committee data for additional reps' do
      members = feed[:studentCommittees][0][:committeeMembers]
      expect(members[:additionalReps][0][:name]).to eq 'MEMBERFIRSTNAME5 MEMBERLASTNAME5'
      expect(members[:additionalReps][0][:email]).to eq 'MEMBER@EMAIL.5'
      expect(members[:additionalReps][0][:primaryDepartment]).to eq 'MEMBERDEPTDESCR5'

      expect(members[:additionalReps][1][:name]).to eq 'MEMBERFIRSTNAME6 MEMBERLASTNAME6'
      expect(members[:additionalReps][1][:email]).to eq 'MEMBER@EMAIL.6'
      expect(members[:additionalReps][1][:primaryDepartment]).to eq 'MEMBERDEPTDESCR6'
    end

    it 'contains the expected student committee data for academic senate' do
      members = feed[:studentCommittees][0][:committeeMembers]
      expect(members[:academicSenate][0][:name]).to eq 'MEMBERFIRSTNAME7 MEMBERLASTNAME7'
      expect(members[:academicSenate][0][:email]).to eq 'MEMBER@EMAIL.7'
      expect(members[:academicSenate][0][:primaryDepartment]).to eq 'MEMBERDEPTDESCR7'
    end
  end
end
