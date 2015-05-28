module CampusSolutions

  class DirectProxy < Proxy

    def initialize(options = {})
      super(Settings.campus_solutions_proxy, options)
      initialize_mocks if @fake
    end

    def request_options
      {
        basic_auth: {
          username: @settings.username,
          password: @settings.password
        }
      }
    end

    def post(params = {})
      updateable_params = filter_updateable_params params
      logger.debug "Updateable params from POST: #{updateable_params.inspect}"
      cs_post = construct_cs_post updateable_params
      logger.debug "CS Post: #{cs_post}"
      {
        updated: true,
        updatedFields: updateable_params
      }
    end

    # lets us restrict updated params to what's on the whitelist of field mappings.
    def filter_updateable_params(params)
      updateable = {}
      known_fields = self.class.field_mappings
      params.keys.each do |param_name|
        if known_fields[param_name.to_sym].present?
          updateable[param_name.to_sym] = params[param_name]
        end
      end
      updateable
    end

    def construct_cs_post(filtered_params)
      cs_post = {}
      filtered_params.keys.each do |calcentral_param_name|
        mapping = self.class.field_mappings[calcentral_param_name]
        next if mapping.blank?
        cs_param_name = mapping[:campus_solutions_name]
        cs_post[cs_param_name] = filtered_params[calcentral_param_name]
      end
      cs_post
    end

  end
end