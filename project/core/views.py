from django.shortcuts import render

# config index.
def index(request):
    return render(request,'core/index.html')
