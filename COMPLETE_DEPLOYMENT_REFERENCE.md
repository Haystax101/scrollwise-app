# 📚 Complete Academic Reels Backend Deployment & Management Reference

## 🚀 **Quick Start Guide**

### **Prerequisites Checklist**
- [ ] Google Cloud Project created with billing enabled
- [ ] gcloud CLI installed and authenticated
- [ ] Supabase URL and API Key ready
- [ ] Gemini API Key ready
- [ ] Book lists and RSS feeds updated

### **Deployment (3 Commands)**
```bash
# 1. Set your project ID in the deploy script
nano setup-scripts/deploy.sh
# Update: PROJECT_ID="your-actual-project-id"

# 2. Run automated deployment
./setup-scripts/deploy.sh

# 3. Test it works
make run
```

---

## 🏗️ **Architecture Overview**

### **Why Cloud Run Jobs + Cloud Scheduler?**

| Feature | Benefit |
|---------|---------|
| **Cost-effective** | Pay only when running (~$10-15/month) |
| **Scalable** | Auto-scales based on workload |
| **Managed** | No server maintenance required |
| **Reliable** | Built-in retry mechanisms |
| **Secure** | IAM + Secret Manager integration |

### **Alternative Architectures Considered**

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **Cloud Functions** | Simplest setup | 15-min timeout limit | ❌ Script needs 30+ minutes |
| **Cloud Run Services** | Always available | Costs more for batch jobs | ❌ Overkill for scheduled tasks |
| **Compute Engine + Cron** | Full control | Manual maintenance | ❌ Not serverless |
| **Cloud Run Jobs** ✅ | Perfect for batch work | Slightly more setup | ✅ **RECOMMENDED** |

---

## 📋 **Google Cloud Console Setup**

### **Step 1: Create Project**
1. Go to https://console.cloud.google.com/
2. Click project dropdown → "New Project"
3. Name: `Academic Reels Backend`
4. Note the Project ID: `academic-reels-backend-123456`

### **Step 2: Enable Billing**
1. Go to "Billing" → Link billing account
2. New users get $300 free credits

### **Step 3: Install & Authenticate gcloud**

**Install gcloud CLI:**
```bash
# Method 1: Official installer (recommended)
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Method 2: Homebrew (if Method 1 fails)
brew install google-cloud-sdk
```

**Authenticate:**
```bash
gcloud init
# This opens browser for authentication
# Select your project and region (us-central1)
```

**Verify Setup:**
```bash
gcloud auth list
gcloud config get-value project
gcloud projects describe $(gcloud config get-value project)
```

### **Troubleshooting gcloud Installation**

**Common Issue: Python path errors on macOS**
```bash
# Solution 1: Reinstall with correct Python
brew uninstall google-cloud-sdk
brew install python@3.11
brew install google-cloud-sdk

# Solution 2: Use official installer
curl https://sdk.cloud.google.com | bash

# Solution 3: Use Cloud Shell (browser-based)
# Go to console.cloud.google.com → Click Cloud Shell icon
```

---

## 🔐 **API Credentials Setup**

### **Supabase Credentials**
1. Go to Supabase project dashboard
2. Settings → API
3. Copy:
   - **Project URL**: `https://xyz.supabase.co`
   - **Anon Key**: `eyJ...`

### **Gemini API Key**
1. Go to https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the generated key

### **Store Securely (Optional)**
```bash
# Create temporary secure file
cat > ~/.academic-reels-secrets << EOF
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=eyJ...your-key-here
GEMINI_API_KEY=your-gemini-key-here
EOF

chmod 600 ~/.academic-reels-secrets
```

---

## 📁 **File Structure & Configuration**

### **Created Files**
```
academicReelsBackend-1/
├── Dockerfile                           # Container configuration
├── .dockerignore                        # Files to exclude from container
├── cloudbuild.yaml                      # CI/CD pipeline
├── job.yaml                            # Cloud Run Job configuration
├── Makefile                            # Management commands
├── setup-scripts/
│   └── deploy.sh                       # Automated deployment script
└── docs/
    ├── SERVERLESS_DEPLOYMENT_GUIDE.md  # Comprehensive guide
    ├── TYPE_SAFETY_FIXES.md            # Bug fixes documentation
    ├── PROMPT_CONSISTENCY_IMPROVEMENTS.md
    ├── BATCH_PROCESSING_OPTIMIZATION.md
    └── ARTICLE_PROCESSING_ERROR_FIXES.md
```

### **Key Configuration Details**

**Resource Allocation (job.yaml):**
```yaml
resources:
  limits:
    cpu: "2"      # 2 vCPUs
    memory: "4Gi" # 4 GB RAM
  requests:
    cpu: "1"      # 1 vCPU minimum
    memory: "2Gi" # 2 GB RAM minimum
```

**Timeout Settings:**
- Task Timeout: 1 hour (3600s)
- Can be increased up to 24 hours if needed

**Default Schedule:**
- Daily at 9:00 AM UTC (`0 9 * * *`)
- Timezone conversions:
  - PST/PDT: 1:00 AM / 2:00 AM
  - EST/EDT: 4:00 AM / 5:00 AM
  - GMT: 9:00 AM
  - CET: 10:00 AM

---

## 🚀 **Deployment Process**

### **Pre-Deployment: Update Your Data**

**Update Book Lists:**
```bash
# Check current format: Title|Author|Year
cat book_lists/finance_books.txt

# Add more books
echo "The Intelligent Investor|Benjamin Graham|1949" >> book_lists/finance_books.txt
echo "Clean Code|Robert C. Martin|2008" >> book_lists/tech_books.txt
```

**Update RSS Feeds (backend.py):**
```python
NEWS_FEEDS = {
    "finance": {
        "Financial Times": "https://www.ft.com/rss/home",
        "Bloomberg": "https://feeds.bloomberg.com/markets/news.rss",
        "Reuters Finance": "https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best",
        # Add more...
    },
    "technology": {
        "TechCrunch": "https://techcrunch.com/feed/",
        "Ars Technica": "https://feeds.arstechnica.com/arstechnica/index",
        "The Verge": "https://www.theverge.com/rss/index.xml",
        # Add more...
    },
    # Expand other categories...
}
```

### **Automated Deployment**

**Step 1: Configure**
```bash
# Edit deployment script with your project ID
nano setup-scripts/deploy.sh
# Update: PROJECT_ID="academic-reels-backend-123456"
```

**Step 2: Deploy**
```bash
# Make executable and run
chmod +x setup-scripts/deploy.sh
./setup-scripts/deploy.sh
```

**The script will:**
1. ✅ Enable required Google Cloud APIs
2. ✅ Create dedicated service account
3. ✅ Set up IAM permissions
4. ✅ Store secrets securely in Secret Manager
5. ✅ Build and deploy container
6. ✅ Create Cloud Run Job
7. ✅ Set up daily scheduling

**Step 3: Test**
```bash
# Manual test run
make run

# View logs
make logs

# Check status
make status
```

### **Manual Deployment (Alternative)**

If the automated script fails:

```bash
# Enable APIs
gcloud services enable cloudbuild.googleapis.com run.googleapis.com cloudscheduler.googleapis.com secretmanager.googleapis.com

# Create service account
gcloud iam service-accounts create academic-reels-sa

# Store secrets
echo "your-supabase-url" | gcloud secrets create supabase-url --data-file=-
echo "your-supabase-key" | gcloud secrets create supabase-key --data-file=-
echo "your-gemini-key" | gcloud secrets create gemini-api-key --data-file=-

# Build and deploy
gcloud builds submit --config cloudbuild.yaml .
sed "s/PROJECT_ID/$PROJECT_ID/g" job.yaml > job-deploy.yaml
gcloud run jobs replace job-deploy.yaml --region=us-central1

# Set up scheduler
gcloud scheduler jobs create http academic-reels-scheduler \
    --location=us-central1 \
    --schedule="0 9 * * *" \
    --uri="https://us-central1-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/$PROJECT_ID/jobs/academic-reels-data-aggregation:run" \
    --http-method=POST \
    --oauth-service-account-email="academic-reels-sa@${PROJECT_ID}.iam.gserviceaccount.com"
```

---

## 🎮 **Management Commands (Makefile)**

### **Daily Operations**
```bash
make help           # Show all available commands
make run            # Execute job manually
make logs           # View recent logs
make logs-live      # Follow logs in real-time
make status         # Check job and scheduler status
```

### **Development**
```bash
make dev-build      # Build container locally
make dev-run        # Test run locally
make test-local     # Full local test with .env file
```

### **Updates**
```bash
make build          # Rebuild container with latest code
make update-job     # Update job configuration
make update-schedule SCHEDULE="0 6 * * *"  # Change schedule
```

### **Monitoring**
```bash
make monitor        # Open monitoring dashboards
make costs          # Show cost estimates
make secrets-list   # List all secrets
make secrets-update # Update API credentials
```

### **Emergency Controls**
```bash
make emergency-disable  # Stop scheduler
make emergency-enable   # Resume scheduler
make clean             # Clean up build artifacts
```

---

## 📊 **What Happens When You Deploy**

### **Timeline**

| **When** | **What Happens** | **Action Required** |
|----------|------------------|-------------------|
| **Today (deployment)** | Infrastructure created, scheduler configured | ✅ One-time setup |
| **Today (optional)** | Manual test run | `make run` (recommended) |
| **Tomorrow at 9:00 AM UTC** | First automatic execution | ❌ None - fully automated |
| **Every day thereafter** | Automatic daily execution | ❌ None - fully automated |

### **What Gets Created**

**Google Cloud Resources:**
- 🏗️ **Cloud Run Job**: `academic-reels-data-aggregation`
- ⏰ **Cloud Scheduler**: `academic-reels-data-aggregation-scheduler`
- 🔐 **Secrets**: `supabase-credentials`, `gemini-credentials`
- 👤 **Service Account**: `academic-reels-sa`
- 📦 **Container Image**: `gcr.io/PROJECT_ID/academic-reels-backend`

**Expected Behavior:**
- ✅ Script runs automatically every day at 9 AM UTC
- ✅ Processes articles, papers, and books
- ✅ Stores data in Supabase with proper categorization
- ✅ Handles errors gracefully with fallbacks
- ✅ Logs everything for debugging

---

## 🔄 **File Updates & Maintenance**

### **Important: How File Updates Work**

When you deploy, files get **"baked into" the container**:
- ✅ **Files included**: `book_lists/*.txt` and RSS feeds are copied
- ❌ **Not auto-updated**: Local changes don't affect running container
- 🔄 **Updates require rebuild**: Must rebuild container for changes

### **Update Workflow**

**For book lists and RSS feeds:**
```bash
# 1. Update files locally
nano book_lists/finance_books.txt
nano backend.py  # Update NEWS_FEEDS

# 2. Rebuild and redeploy
make build
make update-job

# 3. Test the update
make run
make logs
```

**Alternative full rebuild:**
```bash
gcloud builds submit --config cloudbuild.yaml .
gcloud run jobs replace job.yaml --region=us-central1
```

---

## 💰 **Cost Analysis**

### **Detailed Cost Breakdown**

**Cloud Run Jobs:**
- CPU: ~$0.0000624 per vCPU-second
- Memory: ~$0.0000069 per GiB-second
- Requests: $0.0000004 per request

**Monthly Estimate (30-min daily runs):**
- CPU: 2 vCPU × 1800s × 30 days × $0.0000624 = **$6.74/month**
- Memory: 4 GiB × 1800s × 30 days × $0.0000069 = **$1.49/month**
- Requests: 30 requests × $0.0000004 = **$0.01/month**

**Additional Services:**
- Cloud Build: ~$1-2/month (daily builds)
- Container Registry: ~$1/month (image storage)
- Cloud Scheduler: Free (first 3 jobs)
- Secret Manager: ~$1/month (API access)

**Total: ~$10-15/month** 💰

### **Cost Optimization Tips**
- Reduce CPU/memory if script runs efficiently
- Use Cloud Build triggers only when code changes
- Monitor with budget alerts at $20/month

---

## 🔍 **Monitoring & Debugging**

### **Key Metrics to Monitor**
1. **Job Success Rate**
2. **Execution Duration**
3. **Memory Usage**
4. **Error Rate**
5. **API Call Volumes**

### **Log Commands**
```bash
# Recent logs
gcloud logging read "resource.type=cloud_run_job AND resource.labels.job_name=academic-reels-data-aggregation" --limit=50

# Live logs during execution
gcloud logging tail "resource.type=cloud_run_job AND resource.labels.job_name=academic-reels-data-aggregation"

# Execution history
gcloud run jobs executions list --job=academic-reels-data-aggregation --region=us-central1
```

### **Console URLs**
Replace `PROJECT_ID` with your actual project ID:
- **Cloud Run Jobs**: `https://console.cloud.google.com/run/jobs?project=PROJECT_ID`
- **Cloud Scheduler**: `https://console.cloud.google.com/cloudscheduler?project=PROJECT_ID`
- **Logs**: `https://console.cloud.google.com/logs?project=PROJECT_ID`
- **Secret Manager**: `https://console.cloud.google.com/security/secret-manager?project=PROJECT_ID`

---

## 🚨 **Troubleshooting Guide**

### **Common Issues & Solutions**

**1. Permission Denied**
```bash
# Check service account permissions
gcloud projects get-iam-policy $PROJECT_ID --flatten="bindings[].members" --filter="bindings.members:academic-reels-sa@$PROJECT_ID.iam.gserviceaccount.com"

# Fix: Add missing roles
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:academic-reels-sa@${PROJECT_ID}.iam.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"
```

**2. Job Timeout**
```bash
# Increase timeout in job.yaml
taskTimeout: 7200s  # 2 hours
```

**3. Memory Issues**
```bash
# Increase memory allocation
resources:
  limits:
    memory: "8Gi"
```

**4. Secrets Not Found**
```bash
# Verify secrets exist
gcloud secrets list
gcloud secrets versions access latest --secret=supabase-url
```

**5. 'NoneType' Errors (Fixed)**
- ✅ Added null-safe string slicing
- ✅ Fixed error handling in insert functions
- ✅ Added data validation checks

### **Debug Container Locally**
```bash
# Test container locally
docker run -it --entrypoint=/bin/bash gcr.io/$PROJECT_ID/academic-reels-backend:latest

# Check job configuration
gcloud run jobs describe academic-reels-data-aggregation --region=us-central1
```

---

## 🎯 **Post-Deployment Checklist**

### **Immediate Verification**
- [ ] Cloud Run Job exists and is configured
- [ ] Cloud Scheduler job is enabled
- [ ] Secrets are stored securely
- [ ] Manual job execution works (`make run`)
- [ ] Logs show successful processing (`make logs`)

### **Data Verification**
- [ ] Articles being inserted with proper authors
- [ ] Papers categorized correctly by AI
- [ ] Books have key insights arrays
- [ ] All content has valid industry_id
- [ ] Search vectors are populated

### **Ongoing Monitoring**
- [ ] Set up budget alerts ($20/month)
- [ ] Monitor first few scheduled runs
- [ ] Check Supabase for data quality
- [ ] Verify RSS feeds are working
- [ ] Monitor API usage (Gemini limits)

---

## 🔧 **Advanced Configuration**

### **Custom Schedules**
```bash
# Every 6 hours
"0 */6 * * *"

# Twice daily (9 AM and 9 PM UTC)
"0 9,21 * * *"

# Weekdays only at 8 AM UTC
"0 8 * * 1-5"

# Every Sunday at midnight UTC
"0 0 * * 0"
```

### **Scaling Options**
```yaml
# High-performance configuration
resources:
  limits:
    cpu: "4"
    memory: "8Gi"
taskTimeout: 7200s  # 2 hours
```

### **Multi-region Deployment**
```bash
# Deploy to multiple regions for redundancy
gcloud run jobs replace job.yaml --region=us-central1
gcloud run jobs replace job.yaml --region=europe-west1
gcloud run jobs replace job.yaml --region=asia-east1
```

---

## 📞 **Support & Help**

### **Quick Help Commands**
```bash
# Google Cloud help
gcloud run jobs --help
gcloud scheduler jobs --help
gcloud builds --help

# Check service status
gcloud run jobs describe academic-reels-data-aggregation --region=us-central1
gcloud scheduler jobs describe academic-reels-scheduler --location=us-central1

# Project status
gcloud config list
gcloud projects describe $(gcloud config get-value project)
```

### **Useful Resources**
- **Google Cloud Console**: https://console.cloud.google.com/
- **Cloud Run Documentation**: https://cloud.google.com/run/docs
- **Cloud Scheduler Documentation**: https://cloud.google.com/scheduler/docs
- **gcloud CLI Reference**: https://cloud.google.com/sdk/gcloud/reference

---

## 🎉 **Summary**

You now have a **production-ready, cost-effective, fully-managed serverless data pipeline** that:

✅ **Runs automatically** every day at 9 AM UTC  
✅ **Processes** articles, papers, and books with AI  
✅ **Costs** only ~$10-15/month  
✅ **Scales** automatically based on workload  
✅ **Handles errors** gracefully with built-in retries  
✅ **Requires zero maintenance** after deployment  

**Your Academic Reels backend is now enterprise-ready!** 🚀

---

*Last updated: Based on chat session with comprehensive deployment setup and troubleshooting* 