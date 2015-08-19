module CampusSolutions
  class State < DirectProxy

    def initialize(options = {})
      super options
      @country = options[:country]
      initialize_mocks if @fake
    end

    def xml_filename
      'state.xml'
    end

    def instance_key
      @country
    end

    def build_feed(response)
      feed = {
        states: []
      }
      return feed if response.parsed_response.blank?
      # TODO does front-end need to lookup by name/abbv, or is an array sufficient?
      response.parsed_response['STATES'].each do |state|
        feed[:states] << state
      end
      feed
    end

    def url
      "#{@settings.base_url}/UC_STATE_GET.v1/state/get/?COUNTRY=#{@country}"
    end

  end
end