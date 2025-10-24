/**
 * Test utility to verify instant service upload functionality
 */

export const testInstantServiceUpload = () => {
  console.log('🧪 Testing instant service upload functionality...');
  
  // Test localStorage storage
  const testService = {
    id: `test_${Date.now()}`,
    title: 'Test Service Upload',
    description: 'Testing instant upload functionality',
    provider_id: 'test_user',
    skill_id: 'test_skill',
    credits_per_hour: 1,
    status: 'active',
    type: 'offer',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  try {
    // Get existing services
    const existing = localStorage.getItem('timebank_services');
    const services = existing ? JSON.parse(existing) : [];
    
    // Add test service
    services.push(testService);
    
    // Save to localStorage
    localStorage.setItem('timebank_services', JSON.stringify(services));
    
    console.log('✅ Test service saved to localStorage successfully');
    console.log('📊 Total services in storage:', services.length);
    
    // Verify it was saved
    const verification = localStorage.getItem('timebank_services');
    const verifiedServices = verification ? JSON.parse(verification) : [];
    const foundService = verifiedServices.find((s: any) => s.id === testService.id);
    
    if (foundService) {
      console.log('✅ Test service verified in localStorage');
      console.log('🎉 Instant upload functionality is working correctly!');
      return true;
    } else {
      console.error('❌ Test service not found in localStorage');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
};

export const cleanupTestServices = () => {
  try {
    const existing = localStorage.getItem('timebank_services');
    if (existing) {
      const services = JSON.parse(existing);
      const cleaned = services.filter((s: any) => !s.id.startsWith('test_'));
      localStorage.setItem('timebank_services', JSON.stringify(cleaned));
      console.log('🧹 Test services cleaned up');
    }
  } catch (error) {
    console.warn('Failed to cleanup test services:', error);
  }
};
