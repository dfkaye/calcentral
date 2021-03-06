class OecGoogleAuthController < GoogleAuthController
  include ClassLogger

  before_filter :check_google_access
  before_action :authorize_oec_administration
  respond_to :json

  def authorize_oec_administration
    authorize current_user, :can_administer_oec?
  end

  private

  def google
    @google ||= GoogleApps::Oauth2TokensGrant.new(
      opts[:uid],
      GoogleApps::Proxy::OEC_APP_ID,
      opts[:client_id],
      opts[:client_secret],
      client_redirect_uri)
  end

  def opts
    @opts ||= Settings.oec.google.marshal_dump
  end

  def client_redirect_uri
    url_for only_path: false, controller: 'oec_google_auth', action: 'handle_callback'
  end

end
